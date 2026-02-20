import chalk from "chalk";
import { setTheme, getCurrentTheme } from "../lib/config.js";
import { getThemeNames } from "../lib/themes.js";
import { loadFavorites } from "../lib/favorites.js";
import { select } from "../lib/prompt.js";

export async function listCommand(options: { all?: boolean }): Promise<void> {
  const items = options.all ? getThemeNames() : loadFavorites();
  const currentTheme = getCurrentTheme();

  if (items.length === 0) {
    console.log(chalk.yellow("No themes to display."));
    return;
  }

  const selected = await select({
    message: options.all ? "All themes:" : "Favorites:",
    items,
    currentTheme,
  });

  if (!selected) {
    console.log(chalk.dim("Cancelled."));
    return;
  }

  const prev = getCurrentTheme();
  setTheme(selected);

  if (prev) {
    console.log(chalk.dim(`${prev} →`) + " " + chalk.bold.green(selected));
  } else {
    console.log(chalk.bold.green(`Theme set to: ${selected}`));
  }
}
