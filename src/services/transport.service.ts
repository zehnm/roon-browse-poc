import type RoonApiTransport from "node-roon-api-transport";
import type { Zone } from "../types/config.js";

export class TransportService {
  constructor(private transportApi: typeof RoonApiTransport.prototype) {}

  async getZones(): Promise<Zone[]> {
    return new Promise((resolve, reject) => {
      let resolved = false;

      (this.transportApi as any).subscribe_zones((messageOrErr: string | false | { zones?: Zone[] }, data?: any) => {
        // Roon subscription callback pattern:
        // First call:    ('Subscribed', { zones: [...] })
        // Updates:       ({ zones: [...] })
        // Errors:        ('ErrorMessage')

        // Check if this is an actual error (string that's not "Subscribed")
        if (typeof messageOrErr === "string" && messageOrErr !== "Subscribed") {
          if (!resolved) {
            resolved = true;
            reject(new Error(messageOrErr));
          }
          return;
        }

        // Extract zones from either parameter
        let zones: Zone[] | undefined;

        if (typeof messageOrErr === "object" && messageOrErr.zones) {
          // Second form: zones in first parameter
          zones = messageOrErr.zones;
        } else if (data && typeof data === "object" && data.zones) {
          // First form: zones in second parameter
          zones = data.zones;
        }

        // Process zones if we got them
        if (zones && !resolved) {
          resolve(zones);
          // resolved = true;
          // if (zones.length === 0) {
          //   reject(new Error('No zones available on this Roon Core'));
          // } else {
          //   resolve(zones);
          // }
        }

        // Ignore subsequent subscription updates
      });
    });
  }
}
