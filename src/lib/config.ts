import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

function getXdgConfigHome(): string {
  return process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
}

function getConfigPath(): string {
  // テスト・開発用オーバーライド
  if (process.env.GHOSTTY_CONFIG_PATH) {
    return process.env.GHOSTTY_CONFIG_PATH;
  }

  // macOS: ~/Library/Application Support/com.mitchellh.ghostty/config.ghostty が存在すれば優先
  if (process.platform === "darwin") {
    const appSupportDir = join(
      homedir(),
      "Library",
      "Application Support",
      "com.mitchellh.ghostty",
    );
    const appSupportGhosttyPath = join(appSupportDir, "config.ghostty");
    if (existsSync(appSupportGhosttyPath)) {
      return appSupportGhosttyPath;
    }

    const appSupportPath = join(
      appSupportDir,
      "config",
    );
    if (existsSync(appSupportPath)) {
      return appSupportPath;
    }
  }

  // XDG準拠のデフォルトパス（全プラットフォーム共通）
  const xdgConfigDir = join(getXdgConfigHome(), "ghostty");
  const xdgGhosttyPath = join(xdgConfigDir, "config.ghostty");
  if (existsSync(xdgGhosttyPath)) {
    return xdgGhosttyPath;
  }

  return join(xdgConfigDir, "config");
}

function parseVersion(versionOutput: string): [number, number, number] | null {
  const match = versionOutput.match(/Ghostty\s+(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isAtLeastVersion(
  version: [number, number, number],
  minimum: [number, number, number],
): boolean {
  for (let i = 0; i < minimum.length; i++) {
    if (version[i] > minimum[i]) return true;
    if (version[i] < minimum[i]) return false;
  }
  return true;
}

function ensureGhosttySupportsAppleScript(): void {
  let output: string;
  try {
    output = execFileSync("ghostty", ["+version"], { encoding: "utf-8" });
  } catch {
    throw new Error("Ghostty is not available in PATH.");
  }

  const version = parseVersion(output);
  if (!version || !isAtLeastVersion(version, [1, 3, 0])) {
    throw new Error("Ghostty 1.3.0 or newer is required for AppleScript reload.");
  }
}

function escapeAppleScriptString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function debug(message: string): void {
  if (process.env.GHOSTTY_THEME_DEBUG) {
    console.error(`[ghostty-theme] ${message}`);
  }
}

function getAppPath(commandName: string, appName: string): string {
  try {
    const commandPath = execFileSync("which", [commandName], {
      encoding: "utf-8",
    }).trim();
    const marker = `.app/Contents/MacOS/${commandName}`;
    const markerIndex = commandPath.indexOf(marker);
    if (markerIndex !== -1) {
      const appPath = commandPath.slice(0, markerIndex + ".app".length);
      debug(`${appName}: resolved app path from ${commandName}: ${appPath}`);
      return appPath;
    }
  } catch {
    // Fall back to the standard app location below.
  }

  const appPath = `/Applications/${appName}.app`;
  debug(`${appName}: using fallback app path: ${appPath}`);
  return appPath;
}

function isAppRunning(appPath: string): boolean {
  if (!existsSync(appPath)) {
    debug(`app not found: ${appPath}`);
    return false;
  }

  try {
    const output = execFileSync(
      "osascript",
      ["-e", `application "${escapeAppleScriptString(appPath)}" is running`],
      { encoding: "utf-8" },
    );
    const running = output.trim() === "true";
    debug(`${appPath}: ${running ? "running" : "not running"}`);
    return running;
  } catch {
    debug(`${appPath}: failed to check running state`);
    return false;
  }
}

function reloadConfigInApp(appPath: string): void {
  execFileSync(
    "osascript",
    [
      "-e",
      `tell application "${escapeAppleScriptString(appPath)}"`,
      "-e",
      "set reloadCount to 0",
      "-e",
      "repeat with win in windows",
      "-e",
      "repeat with tab1 in tabs of win",
      "-e",
      "repeat with term1 in terminals of tab1",
      "-e",
      'perform action "reload_config" on term1',
      "-e",
      "set reloadCount to reloadCount + 1",
      "-e",
      "end repeat",
      "-e",
      "end repeat",
      "-e",
      "end repeat",
      "-e",
      "if reloadCount is 0 then error \"No terminals found.\"",
      "-e",
      "end tell",
    ],
    { stdio: "ignore" },
  );
  debug(`reloaded config in ${appPath}`);
}

function reloadTerminalConfigs(): void {
  if (process.platform !== "darwin") {
    throw new Error("Automatic Ghostty config reload requires macOS AppleScript.");
  }

  const apps = [
    {
      appName: "Ghostty",
      appPath: getAppPath("ghostty", "Ghostty"),
    },
    {
      appName: "Cmux",
      appPath: getAppPath("cmux", "cmux"),
    },
  ];

  const failedApps: string[] = [];

  for (const { appName, appPath } of apps) {
    debug(`${appName}: checking app path ${appPath}`);
    if (!isAppRunning(appPath)) {
      debug(`${appName}: skipped because the app is not running`);
      continue;
    }

    try {
      reloadConfigInApp(appPath);
    } catch {
      debug(`${appName}: reload failed`);
      failedApps.push(appName);
    }
  }

  if (failedApps.length > 0) {
    throw new Error(`Failed to reload config in ${failedApps.join(" and ")}.`);
  }
}

export function readConfig(): string {
  try {
    return readFileSync(getConfigPath(), "utf-8");
  } catch {
    return "";
  }
}

export function getCurrentTheme(): string | null {
  const content = readConfig();
  const lines = content.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const match = lines[i].match(/^theme\s*=\s*(.+)$/);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

export function setTheme(themeName: string): void {
  const configPath = getConfigPath();
  debug(`writing theme "${themeName}" to ${configPath}`);
  let content = readConfig();
  const lines = content.split("\n");

  let found = false;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^theme\s*=/.test(lines[i])) {
      lines[i] = `theme = ${themeName}`;
      found = true;
      break;
    }
  }

  if (!found) {
    // Add before first non-empty, non-comment line, or at the top
    lines.unshift(`theme = ${themeName}`);
  }

  writeFileSync(configPath, lines.join("\n"), "utf-8");
}

export function applyTheme(themeName: string): void {
  ensureGhosttySupportsAppleScript();
  setTheme(themeName);
  reloadTerminalConfigs();
}
