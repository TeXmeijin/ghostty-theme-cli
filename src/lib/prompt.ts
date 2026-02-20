import chalk from "chalk";

export interface SelectOptions {
  message: string;
  items: string[];
  currentTheme?: string | null;
}

export function select(options: SelectOptions): Promise<string | null> {
  return new Promise((resolve) => {
    const { message, items, currentTheme } = options;

    if (items.length === 0) {
      console.log(chalk.yellow("No items to display."));
      resolve(null);
      return;
    }

    const stdin = process.stdin;
    const stdout = process.stdout;

    let cursor = 0;
    let searchQuery = "";
    let filteredItems = [...items];
    let renderedLines = 0;

    function getPageSize(): number {
      // Reserve lines for: message, search bar, bottom hint, and padding
      return Math.max(1, (stdout.rows || 24) - 4);
    }

    function getFilteredItems(): string[] {
      if (searchQuery === "") return items;
      const q = searchQuery.toLowerCase();
      return items.filter((item) => item.toLowerCase().includes(q));
    }

    function render(): void {
      // Clear previous output
      if (renderedLines > 0) {
        stdout.write(`\x1B[${renderedLines}A`);
        for (let i = 0; i < renderedLines; i++) {
          stdout.write("\x1B[2K\n");
        }
        stdout.write(`\x1B[${renderedLines}A`);
      }

      const lines: string[] = [];

      // Header
      lines.push(chalk.bold.cyan(message));

      // Search bar
      if (searchQuery) {
        lines.push(chalk.dim(`  🔍 search: ${searchQuery}`));
      } else {
        lines.push(chalk.dim("  Type to search, ↑↓/jk/Ctrl+jk to move, Enter to select, q to cancel"));
      }

      filteredItems = getFilteredItems();

      if (filteredItems.length === 0) {
        lines.push(chalk.yellow("  No matches found."));
      } else {
        // Clamp cursor
        if (cursor >= filteredItems.length) {
          cursor = filteredItems.length - 1;
        }
        if (cursor < 0) cursor = 0;

        const pageSize = getPageSize();
        const total = filteredItems.length;

        // Calculate viewport
        let start = 0;
        if (total > pageSize) {
          start = Math.max(0, cursor - Math.floor(pageSize / 2));
          if (start + pageSize > total) {
            start = total - pageSize;
          }
        }
        const end = Math.min(start + pageSize, total);

        if (start > 0) {
          lines.push(chalk.dim(`  ▲ ${start} more above`));
        }

        for (let i = start; i < end; i++) {
          const item = filteredItems[i];
          const isCurrent = currentTheme && item.toLowerCase() === currentTheme.toLowerCase();
          const marker = isCurrent ? chalk.green(" *") : "  ";

          if (i === cursor) {
            lines.push(chalk.bgBlue.white(`❯ ${item}`) + marker);
          } else {
            lines.push(`  ${item}${marker}`);
          }
        }

        if (end < total) {
          lines.push(chalk.dim(`  ▼ ${total - end} more below`));
        }

        lines.push(chalk.dim(`  ${total} items`));
      }

      const output = lines.join("\n") + "\n";
      stdout.write(output);
      renderedLines = lines.length;
    }

    // Setup raw mode
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf-8");

    function cleanup(): void {
      stdin.setRawMode(wasRaw ?? false);
      stdin.pause();
      stdin.removeListener("data", onKeypress);
    }

    function onKeypress(data: string | Buffer): void {
      const key = typeof data === "string" ? data : data.toString("utf-8");

      // Ctrl+C
      if (key === "\x03") {
        cleanup();
        stdout.write("\n");
        process.exit(0);
      }

      // Escape or q (only when not searching)
      if ((key === "\x1B" || (key === "q" && searchQuery === "")) && key.length === 1) {
        cleanup();
        stdout.write("\n");
        resolve(null);
        return;
      }

      // Enter
      if (key === "\r") {
        cleanup();
        const selected = filteredItems[cursor];
        stdout.write("\n");
        if (selected) {
          resolve(selected);
        } else {
          resolve(null);
        }
        return;
      }

      // Arrow up / k (when not searching) / Ctrl+k
      if (key === "\x1B[A" || (key === "k" && searchQuery === "") || key === "\x0B") {
        cursor = Math.max(0, cursor - 1);
        render();
        return;
      }

      // Arrow down / j (when not searching) / Ctrl+j
      if (key === "\x1B[B" || (key === "j" && searchQuery === "") || key === "\x0A") {
        cursor = Math.min(filteredItems.length - 1, cursor + 1);
        render();
        return;
      }

      // Backspace
      if (key === "\x7F" || key === "\b") {
        if (searchQuery.length > 0) {
          searchQuery = searchQuery.slice(0, -1);
          cursor = 0;
          render();
        }
        return;
      }

      // Printable characters → search
      if (key.length === 1 && key >= " " && key <= "~") {
        searchQuery += key;
        cursor = 0;
        render();
        return;
      }
    }

    stdin.on("data", onKeypress);
    render();
  });
}
