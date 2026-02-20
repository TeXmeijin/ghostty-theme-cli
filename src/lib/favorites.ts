import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import type { Favorites } from "../types.js";

const DEFAULT_FAVORITES = [
  "Cobalt2",
  "TokyoNight",
  "Dracula",
  "Catppuccin Mocha",
  "Nord",
  "Gruvbox Dark",
  "Solarized Dark Higher Contrast",
  "Atom One Dark",
  "Ayu",
  "Kanagawa Dragon",
  "Rose Pine",
  "Everforest Dark Hard",
];

function getFavoritesPath(): string {
  const xdgConfigHome =
    process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(xdgConfigHome, "ghostty-theme-cli", "favorites.json");
}

function ensureDir(): void {
  const dir = dirname(getFavoritesPath());
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function loadFavorites(): string[] {
  const path = getFavoritesPath();
  if (!existsSync(path)) {
    // Initialize with defaults on first run
    ensureDir();
    const data: Favorites = { themes: DEFAULT_FAVORITES };
    writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
    return DEFAULT_FAVORITES;
  }
  try {
    const content = readFileSync(path, "utf-8");
    const data: Favorites = JSON.parse(content);
    return data.themes;
  } catch {
    return DEFAULT_FAVORITES;
  }
}

export function saveFavorites(themes: string[]): void {
  ensureDir();
  const data: Favorites = { themes };
  writeFileSync(getFavoritesPath(), JSON.stringify(data, null, 2), "utf-8");
}

export function addFavorite(name: string): boolean {
  const favorites = loadFavorites();
  if (favorites.some((f) => f.toLowerCase() === name.toLowerCase())) {
    return false;
  }
  favorites.push(name);
  saveFavorites(favorites);
  return true;
}

export function removeFavorite(name: string): boolean {
  const favorites = loadFavorites();
  const idx = favorites.findIndex(
    (f) => f.toLowerCase() === name.toLowerCase()
  );
  if (idx === -1) {
    return false;
  }
  favorites.splice(idx, 1);
  saveFavorites(favorites);
  return true;
}

export function isFavorite(name: string): boolean {
  const favorites = loadFavorites();
  return favorites.some((f) => f.toLowerCase() === name.toLowerCase());
}
