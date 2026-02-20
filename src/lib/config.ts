import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

function getConfigPath(): string {
  return (
    process.env.GHOSTTY_CONFIG_PATH ||
    join(homedir(), ".config", "ghostty", "config")
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
  for (let i = 0; i < lines.length; i++) {
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
