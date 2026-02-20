import { execSync } from "node:child_process";
import type { Theme } from "../types.js";

export function listAllThemes(): Theme[] {
  const output = execSync("ghostty +list-themes", { encoding: "utf-8" });
  return output
    .trim()
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => {
      const match = line.match(/^(.+?)\s+\((.+?)\)$/);
      if (match) {
        return { name: match[1], source: match[2] };
      }
      return { name: line.trim(), source: "unknown" };
    });
}

export function getThemeNames(): string[] {
  return listAllThemes().map((t) => t.name);
}

export function themeExists(name: string): boolean {
  return getThemeNames().some(
    (t) => t.toLowerCase() === name.toLowerCase()
  );
}

export function findTheme(name: string): string | undefined {
  return getThemeNames().find(
    (t) => t.toLowerCase() === name.toLowerCase()
  );
}
