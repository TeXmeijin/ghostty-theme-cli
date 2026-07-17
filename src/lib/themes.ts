import { execFileSync } from "node:child_process";
import type { Theme } from "../types.js";

export type ThemeColor = "all" | "dark" | "light";

export function listAllThemes(color: ThemeColor = "all"): Theme[] {
  const output = execFileSync(
    "ghostty",
    ["+list-themes", "--plain", `--color=${color}`],
    { encoding: "utf-8" }
  );
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

export function getThemeNames(color: ThemeColor = "all"): string[] {
  return [...new Set(listAllThemes(color).map((t) => t.name))];
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
