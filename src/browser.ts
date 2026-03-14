import type RoonApiBrowse from "node-roon-api-browse";
import type RoonApiTransport from "node-roon-api-transport";
import { type Zone } from "node-roon-api-transport";
import { BrowseService } from "./services/browse.service.js";
import { TransportService } from "./services/transport.service.js";
import { Logger } from "./utils/logger.js";
import { selectItemInteractive, selectZoneInteractive } from "./utils/cli-input.js";
import type { AppConfig } from "./types/config.js";

export class InteractiveBrowser {
  private browseService: BrowseService;
  private transportService: TransportService;
  private selectedZone: Zone | null | undefined = null;

  constructor(
    private browseApi: RoonApiBrowse,
    private transportApi: RoonApiTransport,
    private config: AppConfig,
  ) {
    this.browseService = new BrowseService(browseApi, config.imageConfig, config.coreIp!, config.roonPort);
    this.transportService = new TransportService(transportApi);
  }

  async initializeZone(): Promise<void> {
    const zones = await this.transportService.getZones();

    Logger.section("Available Zones");
    Logger.printZones(zones);

    if (this.config.zone) {
      const found = zones.find((z) => z.zone_id === this.config.zone);
      if (!found) throw new Error(`Zone "${this.config.zone}" not found`);
      this.selectedZone = found;
      Logger.success(`Using specified zone: ${found.display_name}`);
    } else if (zones.length === 0) {
      Logger.warn("No zones available on this Roon Core. Playback will not be possible.");
    } else if (zones.length === 1) {
      this.selectedZone = zones[0];
      Logger.success(`Auto-selected only available zone: ${this.selectedZone?.display_name}`);
    } else {
      const zoneId = await selectZoneInteractive(zones, "Select a zone:");
      this.selectedZone = zones.find((z) => z.zone_id === zoneId)!;
      Logger.success(`Selected zone: ${this.selectedZone.display_name}`);
    }
  }

  async browse(): Promise<void> {
    // if (!this.selectedZone) throw new Error('No zone selected. Call initializeZone() first.');

    // Reset browse stack to root
    const rootResult = await this.browseService.browse({
      hierarchy: "browse",
      pop_all: true,
      zone_or_output_id: this.selectedZone?.zone_id,
    });

    if (rootResult.action !== "list" || !rootResult.list) {
      throw new Error("Unexpected response from root browse");
    }

    for (let level = 0; level < this.config.levels; level++) {
      const loadResult = await this.browseService.load({
        hierarchy: "browse",
        offset: 0,
        count: this.config.limit,
      });

      const extended = this.browseService.extendItemsWithArtwork(loadResult.items);
      Logger.printBrowseResults(extended, loadResult.list.title || "Items", loadResult.list.count);

      // Stop after last level
      if (level >= this.config.levels - 1) break;

      // Only offer drillable (list-type) items for navigation
      const drillable = extended.filter((item) => item.hint === "list" && item.itemKey);

      if (drillable.length === 0) {
        Logger.warn("No drillable items at this level. Stopping.");
        break;
      }

      const selectedIdx = await selectItemInteractive(drillable, `Level ${level + 1}: select item to drill into:`);

      const selected = drillable[selectedIdx];
      if (!selected) {
        break;
      }
      Logger.info(`Drilling into: "${selected.title}"`);

      const drillResult = await this.browseService.browse({
        hierarchy: "browse",
        item_key: selected.itemKey,
        zone_or_output_id: this.selectedZone?.zone_id,
      });

      if (drillResult.action !== "list") {
        Logger.warn(`Unexpected drill result action: ${drillResult.action}. Stopping.`);
        break;
      }
    }
  }
}
