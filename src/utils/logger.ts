import chalk from "chalk";
import Table from "cli-table3";
import type { BrowseItemExtended } from "../types/config";

const DEBUG_MODE = process.env.DEBUG === "1" || process.env.DEBUG === "true";

export class Logger {
  static debug(message: string): void {
    if (DEBUG_MODE) {
      console.log(chalk.gray(`[DEBUG] ${message}`));
    }
  }

  static info(message: string): void {
    console.log(chalk.blue.bold("ℹ"), message);
  }

  static success(message: string): void {
    console.log(chalk.green.bold("✓"), message);
  }

  static error(message: string, err?: Error): void {
    console.error(chalk.red.bold("✖"), message);
    if (err) {
      if (err.message) {
        console.error(chalk.red(`  ${err.message}`));
      }
      if (DEBUG_MODE && err.stack) {
        console.error(chalk.red(err.stack));
      }
    }
  }

  static warn(message: string): void {
    console.log(chalk.yellow.bold("⚠"), message);
  }

  static section(title: string): void {
    console.log("\n" + chalk.bold.cyan(`\n━━━ ${title} ━━━\n`));
  }

  static printZones(
    zones: Array<{ zone_id: string; display_name: string }>,
  ): void {
    const table = new Table({
      head: [chalk.bold("Zone ID"), chalk.bold("Display Name")],
      colWidths: [36, 40],
      wordWrap: true,
    });
    zones.forEach((zone) => {
      table.push([zone.zone_id, zone.display_name]);
    });
    console.log(table.toString());
  }

  static printBrowseResults(
    items: BrowseItemExtended[],
    listTitle: string,
    totalCount: number,
  ): void {
    this.section(`${listTitle} (${items.length}/${totalCount} items)`);

    const table = new Table({
      head: [
        chalk.bold("#"),
        chalk.bold("Title"),
        chalk.bold("Subtitle"),
        chalk.bold("Type"),
        chalk.bold("Artwork URL"),
      ],
      colWidths: [4, 30, 25, 12, 55],
      wordWrap: true,
    });

    items.forEach((item, index) => {
      table.push([
        String(index + 1),
        item.title || "-",
        item.subtitle || "-",
        chalk.cyan(item.hint || "unknown"),
        item.artworkUrl ? chalk.blue(item.artworkUrl) : chalk.gray("(none)"),
      ]);
    });

    console.log(table.toString());
  }

  static printPlaybackInfo(itemKey: string, zoneDisplayName: string): void {
    this.success(`Now playing item "${itemKey}" on zone "${zoneDisplayName}"`);
  }
}
