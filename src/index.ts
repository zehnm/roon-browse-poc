// CRITICAL: Must be first line before any Roon imports
import WebSocket from "ws";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import RoonApi from "node-roon-api";
import RoonApiBrowse from "node-roon-api-browse";
import RoonApiTransport from "node-roon-api-transport";
import RoonApiImage from "node-roon-api-image";
import RoonApiStatus from "node-roon-api-status";
import { Logger } from "./utils/logger.js";
import { InteractiveBrowser } from "./browser.js";
import { PlaybackHandler } from "./playback.js";
import {
  IMAGE_CONFIG,
  ROON_API_PORT,
  ROON_IMAGE_PORT,
  ROON_DISCOVERY_TIMEOUT_MS,
  DEFAULT_BROWSE_LIMIT,
  DEFAULT_BROWSE_LEVELS
} from "./config/constants.js";
import type { AppConfig, CliArgs } from "./types/config.js";
(global as any).WebSocket = WebSocket;

let discoveryTimeout: NodeJS.Timeout | null = null;
let coreReady = false;
let discoveredCoreInfo: { host: string; port: number } | null = null;

async function parseArgs(): Promise<CliArgs> {
  const argv = await yargs(hideBin(process.argv))
    .option("core", {
      type: "string",
      description: "Roon Core IP address (ADVANCED: only use if discovery fails)",
      alias: "c"
    })
    .option("port", {
      type: "number",
      description: "Roon Core WebSocket port (ADVANCED: only if hardcoding connection)",
      alias: "p"
    })
    .option("zone", {
      type: "string",
      description: "Zone ID to use for playback/browse",
      alias: "z"
    })
    .option("levels", {
      type: "number",
      description: "Number of browse levels to navigate",
      default: DEFAULT_BROWSE_LEVELS,
      alias: "l"
    })
    .option("limit", {
      type: "number",
      description: "Max items per browse level",
      default: DEFAULT_BROWSE_LIMIT,
      alias: "n"
    })
    .option("play", {
      type: "string",
      description: "item_key to play instead of browsing",
      alias: "a"
    })
    .example("$0", "Use UDP discovery (RECOMMENDED)")
    .example("$0 --levels 3 --limit 15", "Browse 3 levels with custom limit")
    .example("$0 --core 192.168.1.100 --port 9330", "Advanced: direct connection")
    .help()
    .parseAsync();

  return {
    core: argv.core,
    port: argv.port,
    zone: argv.zone,
    levels: argv.levels,
    limit: argv.limit,
    play: argv.play
  };
}

async function runWithCore(core: any, args: CliArgs): Promise<void> {
  Logger.debug(`Core object keys: ${Object.keys(core).join(", ")}`);
  Logger.debug(`Core services: ${Object.keys(core.services).join(", ")}`);
  Logger.debug(`Core display_name: ${core.display_name}`);
  Logger.debug(`Core display_version: ${core.display_version}`);

  // Use discovered core IP, or fall back to args.core (advanced mode)
  const coreIp = discoveredCoreInfo?.host || args.core || "unknown";

  const config: AppConfig = {
    ...args,
    coreIp,
    roonPort: ROON_IMAGE_PORT,
    imageConfig: IMAGE_CONFIG
  };

  const browseApi = core.services["RoonApiBrowse"];
  const transportApi = core.services["RoonApiTransport"];

  Logger.debug(`browseApi available: ${!!browseApi}`);
  Logger.debug(`transportApi available: ${!!transportApi}`);

  if (!browseApi) {
    throw new Error(
      "RoonApiBrowse service not available. Extension may not be enabled in Roon UI. Available services: " +
        Object.keys(core.services).join(", ")
    );
  }
  if (!transportApi) {
    throw new Error(
      "RoonApiTransport service not available. Extension may not be enabled in Roon UI. Available services: " +
        Object.keys(core.services).join(", ")
    );
  }

  if (args.play) {
    const handler = new PlaybackHandler(browseApi, transportApi, config);
    await handler.initializeZone();
    await handler.playItem(args.play);
  } else {
    const browser = new InteractiveBrowser(browseApi, transportApi, config);
    await browser.initializeZone();
    await browser.browse();
  }
}

async function main(): Promise<void> {
  Logger.debug("=== Roon Browse PoC Starting ===");
  Logger.debug(`Node.js version: ${process.version}`);
  Logger.debug(`Platform: ${process.platform}`);
  Logger.debug(`WebSocket global type: ${typeof (global as any).WebSocket}`);

  const args = await parseArgs();
  Logger.debug(`CLI args: ${JSON.stringify(args)}`);

  // Determine mode: discovery (recommended) or direct connection (advanced)
  // Use direct connection if --core is specified
  const useDirectConnection = !!args.core;
  Logger.debug(`Connection mode: ${useDirectConnection ? "direct (advanced)" : "discovery (recommended)"}`);

  Logger.debug("Creating RoonApi instance...");

  let roon: InstanceType<typeof RoonApi>;

  try {
    // Build options object conditionally based on mode
    const roonOptions: any = {
      extension_id: "com.example.roon-browse-poc",
      display_name: "Roon Browse PoC",
      display_version: "1.0.0",
      publisher: "Example",
      email: "admin@example.com"
    };

    if (useDirectConnection) {
      // ADVANCED MODE: Direct connection (core_paired + core_unpaired ONLY)
      Logger.warn("⚠ Using ADVANCED mode: direct WebSocket connection");

      const port = args.port || ROON_API_PORT;
      Logger.info(`Connecting to ${args.core}:${port}...`);

      roonOptions.core_paired = async (core: any) => {
        Logger.debug(">>> core_paired callback invoked <<<");

        if (coreReady) {
          Logger.debug("Core already ready, ignoring duplicate pairing event");
          return;
        }
        coreReady = true;

        if (discoveryTimeout) {
          clearTimeout(discoveryTimeout);
          discoveryTimeout = null;
        }

        Logger.success(`✓ Paired with Roon Core: ${core.display_name} (${core.display_version})`);

        try {
          await runWithCore(core, args);
          Logger.success("Operation complete.");
        } catch (err) {
          Logger.error("Operation failed", err as Error);
          process.exit(1);
        }

        process.exit(0);
      };

      roonOptions.core_unpaired = (core: any) => {
        Logger.debug(">>> core_unpaired callback invoked <<<");
        Logger.warn(`Core unpaired: ${core.display_name}`);
        if (coreReady) {
          Logger.error("Lost connection to Roon Core");
          process.exit(1);
        }
      };
    } else {
      // DISCOVERY MODE: UDP discovery (core_found + core_lost ONLY)
      Logger.info("Using UDP discovery mode (recommended)");

      roonOptions.core_found = (core: any) => {
        Logger.debug(">>> core_found callback invoked <<<");
        Logger.debug(`Discovered core: ${core.display_name} (${core.display_version})`);
        discoveredCoreInfo = {
          host: "127.0.0.1", // Discovery-provided cores connect via localhost
          port: ROON_API_PORT
        };
      };

      roonOptions.core_lost = (core: any) => {
        Logger.debug(">>> core_lost callback invoked <<<");
        Logger.warn(`Core lost: ${core.display_name}`);
        if (coreReady) {
          Logger.error("Lost connection to Roon Core");
          process.exit(1);
        }
      };
    }

    roon = new RoonApi(roonOptions);
    Logger.debug("RoonApi instance created successfully");
  } catch (err) {
    Logger.error("Failed to create RoonApi instance", err as Error);
    throw err;
  }

  Logger.debug("Initializing services...");

  try {
    const svcStatus = new RoonApiStatus(roon);
    Logger.debug("RoonApiStatus created");

    roon.init_services({
      required_services: [RoonApiBrowse, RoonApiTransport, RoonApiImage],
      provided_services: [svcStatus]
    });
    Logger.debug("Services initialized");

    svcStatus.set_status("Running", false);
    Logger.debug("Status set to Running");
  } catch (err) {
    Logger.error("Failed to init_services", err as Error);
    throw err;
  }

  // Start connection based on mode
  if (useDirectConnection) {
    const port = args.port || ROON_API_PORT;
    Logger.debug(`ws_connect parameters: host=${args.core}, port=${port}`);

    try {
      Logger.debug("Calling ws_connect...");

      roon.ws_connect({
        host: args.core as string,
        port,
        onclose: () => {
          Logger.error("WebSocket connection closed unexpectedly");
          if (!coreReady) {
            Logger.error(
              "Connection closed before core_paired callback. Possible causes:\n" +
                `  • Wrong port number (verify with: lsof -iTCP -sTCP:LISTEN -n -P | grep -E "9[0-3][0-9]{2}")\n` +
                "  • Host is unreachable\n" +
                "  • Roon Core is not running\n" +
                "  • Network/firewall blocking connection"
            );
            process.exit(1);
          } else {
            process.exit(1);
          }
        }
      });

      Logger.debug("ws_connect call returned (connection initiated asynchronously)");
    } catch (err) {
      Logger.error("ws_connect threw exception", err as Error);
      throw err;
    }
  } else {
    // Use UDP discovery (RECOMMENDED)
    Logger.info("Starting UDP discovery to find Roon Core on the network...");
    Logger.debug("Calling start_discovery()");

    try {
      roon.start_discovery();
      Logger.debug("start_discovery called successfully");
    } catch (err) {
      Logger.error("start_discovery threw exception", err as Error);
      throw err;
    }

    discoveryTimeout = setTimeout(() => {
      if (!coreReady) {
        Logger.error(
          `No Roon Core found within ${ROON_DISCOVERY_TIMEOUT_MS / 1000}s.\n` +
            "Possible causes:\n" +
            "  • Roon Core is not running\n" +
            "  • Extension not enabled in Roon app (Settings → Extensions → Approve)\n" +
            "  • Network issue or multicast disabled\n" +
            "\n" +
            "If discovery continues to fail, verify the port with:\n" +
            `  lsof -iTCP -sTCP:LISTEN -n -P | grep -E "9[0-3][0-9]{2}"\n` +
            "\n" +
            "Then use: npm start -- --core <IP> --port <PORT>"
        );
        process.exit(1);
      }
    }, ROON_DISCOVERY_TIMEOUT_MS);
    Logger.debug(`Discovery timeout set to ${ROON_DISCOVERY_TIMEOUT_MS}ms`);
  }

  Logger.debug("Main async function complete, process will wait for core_paired callback");

  // Keep process alive
  await new Promise(() => {});
}

process.on("SIGINT", () => {
  Logger.warn("Interrupted. Shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  Logger.warn("Terminated. Shutting down...");
  process.exit(0);
});

process.on("uncaughtException", (err: Error) => {
  Logger.error("UNCAUGHT EXCEPTION", err);
  console.error("Full stack:", err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  if (reason instanceof Error) {
    Logger.error("UNHANDLED PROMISE REJECTION", reason);
    console.error("Full stack:", reason.stack);
  } else {
    Logger.error("UNHANDLED PROMISE REJECTION (non-Error)", new Error(String(reason)));
  }
  process.exit(1);
});

Logger.debug("Calling main()...");

main().catch((err) => {
  Logger.error("Fatal startup error in main()", err as Error);
  console.error("Full stack:", (err as Error).stack);
  process.exit(1);
});
