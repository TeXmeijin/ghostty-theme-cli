import chalk from "chalk";
import { applyTheme, getCurrentTheme } from "../lib/config.js";
import { getThemeNames } from "../lib/themes.js";
import { loadFavorites } from "../lib/favorites.js";

export function randomCommand(options: { all?: boolean; dark?: boolean }): void {
  let pool = [
    ...new Set(
      options.all
        ? getThemeNames(options.dark ? "dark" : "all")
        : loadFavorites(),
    ),
  ];

  if (options.dark && !options.all) {
    const darkThemes = new Set(getThemeNames("dark"));
    pool = pool.filter((theme) => darkThemes.has(theme));
  }

  if (pool.length === 0) {
    console.error(chalk.red("No themes available."));
    process.exit(1);
  }

  const current = getCurrentTheme();
  // Try to pick something different from current
  let candidates = pool.filter((t) => t !== current);
  if (candidates.length === 0) candidates = pool;

  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  const prev = current;
  try {
    applyTheme(picked);
  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }

  if (prev) {
    console.log(chalk.dim(`${prev} →`) + " " + chalk.bold.green(picked));
  } else {
    console.log(chalk.bold.green(`Theme set to: ${picked}`));
  }
}
