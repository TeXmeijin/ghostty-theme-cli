import chalk from "chalk";
import { removeFavorite, loadFavorites } from "../lib/favorites.js";
import { select } from "../lib/prompt.js";

export async function removeCommand(name?: string): Promise<void> {
  if (name) {
    if (removeFavorite(name)) {
      console.log(chalk.green(`Removed "${name}" from favorites.`));
    } else {
      console.log(chalk.yellow(`"${name}" is not in favorites.`));
    }
    return;
  }

  // Interactive: show favorites
  const favorites = loadFavorites();
  if (favorites.length === 0) {
    console.log(chalk.yellow("No favorites to remove."));
    return;
  }

  const selected = await select({
    message: "Select a theme to remove from favorites:",
    items: favorites,
  });

  if (!selected) {
    console.log(chalk.dim("Cancelled."));
    return;
  }

  removeFavorite(selected);
  console.log(chalk.green(`Removed "${selected}" from favorites.`));
}
