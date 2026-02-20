import chalk from "chalk";
import { addFavorite, loadFavorites } from "../lib/favorites.js";
import { findTheme, getThemeNames } from "../lib/themes.js";
import { getCurrentTheme } from "../lib/config.js";
import { select } from "../lib/prompt.js";

export async function addCommand(name: string | undefined, options: { current?: boolean }): Promise<void> {
  if (options.current) {
    const current = getCurrentTheme();
    if (!current) {
      console.error(chalk.red("No theme is currently set."));
      process.exit(1);
    }
    if (addFavorite(current)) {
      console.log(chalk.green(`Added "${current}" to favorites.`));
    } else {
      console.log(chalk.yellow(`"${current}" is already in favorites.`));
    }
    return;
  }

  if (name) {
    const resolved = findTheme(name);
    if (!resolved) {
      console.error(chalk.red(`Theme "${name}" not found.`));
      process.exit(1);
    }
    if (addFavorite(resolved)) {
      console.log(chalk.green(`Added "${resolved}" to favorites.`));
    } else {
      console.log(chalk.yellow(`"${resolved}" is already in favorites.`));
    }
    return;
  }

  // Interactive: show all themes excluding already favorited
  const favorites = new Set(loadFavorites().map((f) => f.toLowerCase()));
  const allThemes = getThemeNames().filter(
    (t) => !favorites.has(t.toLowerCase())
  );

  const selected = await select({
    message: "Select a theme to add to favorites:",
    items: allThemes,
  });

  if (!selected) {
    console.log(chalk.dim("Cancelled."));
    return;
  }

  addFavorite(selected);
  console.log(chalk.green(`Added "${selected}" to favorites.`));
}
