import chalk from "chalk";
import { applyTheme, getCurrentTheme } from "../lib/config.js";
import { findTheme } from "../lib/themes.js";

export function setCommand(name: string): void {
  const resolved = findTheme(name);
  if (!resolved) {
    console.error(chalk.red(`Theme "${name}" not found.`));
    process.exit(1);
  }

  const prev = getCurrentTheme();
  try {
    applyTheme(resolved);
  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }

  if (prev) {
    console.log(chalk.dim(`${prev} →`) + " " + chalk.bold.green(resolved));
  } else {
    console.log(chalk.bold.green(`Theme set to: ${resolved}`));
  }
}
