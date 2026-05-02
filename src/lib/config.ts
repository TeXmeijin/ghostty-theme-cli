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

function getGhosttyAppPath(): string {
  try {
    const ghosttyPath = execFileSync("which", ["ghostty"], {
      encoding: "utf-8",
    }).trim();
    const marker = ".app/Contents/MacOS/ghostty";
    const markerIndex = ghosttyPath.indexOf(marker);
    if (markerIndex !== -1) {
      return ghosttyPath.slice(0, markerIndex + ".app".length);
    }
  } catch {
    // Fall back to the standard app location below.
  }

  return "/Applications/Ghostty.app";
}

function reloadGhosttyConfig(): void {
  if (process.platform !== "darwin") {
    throw new Error("Automatic Ghostty config reload requires macOS AppleScript.");
  }

  const appPath = getGhosttyAppPath();
  if (!existsSync(appPath)) {
    throw new Error(`Ghostty.app was not found at ${appPath}.`);
  }

  execFileSync(
    "osascript",
    [
      "-e",
      `tell application "${escapeAppleScriptString(appPath)}"`,
      "-e",
      "set win to front window",
      "-e",
      "set tab1 to selected tab of win",
      "-e",
      "set term1 to focused terminal of tab1",
      "-e",
      'perform action "reload_config" on term1',
      "-e",
      "end tell",
    ],
    { stdio: "ignore" },
  );
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
  reloadGhosttyConfig();
}
