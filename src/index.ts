#!/usr/bin/env node

import { Command } from "commander";
import { setCommand } from "./commands/set.js";
import { randomCommand } from "./commands/random.js";
import { addCommand } from "./commands/add.js";
import { removeCommand } from "./commands/remove.js";
import { listCommand } from "./commands/list.js";

const program = new Command();

program
  .name("ghostty-theme")
  .description("CLI tool for managing Ghostty terminal themes")
  .version("1.0.0");

program
  .command("set <name>")
  .description("Set theme by name")
  .action(setCommand);

program
  .command("random")
  .description("Apply a random theme from favorites")
  .option("--all", "Pick from all themes instead of favorites")
  .action(randomCommand);

program
  .command("add [name]")
  .description("Add a theme to favorites")
  .option("-c, --current", "Add the currently applied theme")
  .action(addCommand);

program
  .command("remove [name]")
  .description("Remove a theme from favorites")
  .action(removeCommand);

program
  .command("list")
  .description("Browse themes interactively")
  .option("--all", "Show all themes instead of favorites")
  .action(listCommand);

// Default action (no command) → show favorites interactively
program.action(async () => {
  await listCommand({ all: false });
});

program.parse();
