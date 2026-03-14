import type RoonApiBrowse from "node-roon-api-browse";
import { type Item } from "node-roon-api-browse";
import type RoonApiTransport from "node-roon-api-transport";
import { type Zone } from "node-roon-api-transport";
import { BrowseService } from "./services/browse.service.js";
import { TransportService } from "./services/transport.service.js";
import { Logger } from "./utils/logger.js";
import { selectZoneInteractive } from "./utils/cli-input.js";
import type { AppConfig } from "./types/config.js";

export class PlaybackHandler {
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
    } else if (zones.length === 1) {
      this.selectedZone = zones[0] as Zone;
      Logger.success(`Auto-selected zone: ${this.selectedZone?.display_name}`);
    } else {
      const zoneId = await selectZoneInteractive(zones, "Select zone for playback:");
      this.selectedZone = zones.find((z) => z.zone_id === zoneId)!;
      Logger.success(`Selected zone: ${this.selectedZone.display_name}`);
    }
  }

  async playItem(itemKey: string): Promise<void> {
    if (!this.selectedZone) throw new Error("No zone selected. Call initializeZone() first.");

    Logger.info(`Resolving play actions for item key: ${itemKey}`);

    // Navigate to the item to retrieve its action list
    const browseResult = await this.browseService.browse({
      hierarchy: "browse",
      item_key: itemKey,
      zone_or_output_id: this.selectedZone.zone_id,
    });

    if (browseResult.action !== "list") {
      throw new Error(`Expected action list, got: ${browseResult.action}`);
    }

    // Load available actions
    const loadResult = await this.browseService.load({
      hierarchy: "browse",
      offset: 0,
      count: 20,
    });

    // Prefer "Play Now", fall back to any action containing "play"
    const playAction =
      loadResult.items.find((item: Item) => item.hint === "action" && item.title?.toLowerCase().includes("play now")) ??
      loadResult.items.find((item: Item) => item.hint === "action" && item.title?.toLowerCase().includes("play"));

    if (!playAction?.item_key) {
      const available = loadResult.items.map((i: Item) => i.title).join(", ");
      throw new Error(`No play action found. Available actions: ${available}`);
    }

    Logger.info(`Executing action: "${playAction.title}"`);

    const execResult = await this.browseService.browse({
      hierarchy: "browse",
      item_key: playAction.item_key,
      zone_or_output_id: this.selectedZone.zone_id,
    });

    if (execResult.action === "none") {
      Logger.printPlaybackInfo(itemKey, this.selectedZone.display_name);
    } else {
      Logger.warn(`Unexpected execution result: ${execResult.action}`);
    }
  }
}
