import chalk from "chalk";
import { setTheme, getCurrentTheme } from "../lib/config.js";
import { findTheme } from "../lib/themes.js";

export function setCommand(name: string): void {
  const resolved = findTheme(name);
  if (!resolved) {
    console.error(chalk.red(`Theme "${name}" not found.`));
    process.exit(1);
  }

  const prev = getCurrentTheme();
  setTheme(resolved);

  if (prev) {
    console.log(chalk.dim(`${prev} →`) + " " + chalk.bold.green(resolved));
  } else {
    console.log(chalk.bold.green(`Theme set to: ${resolved}`));
  }
}
