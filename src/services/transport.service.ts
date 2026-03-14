import type RoonApiTransport from "node-roon-api-transport";
import type { RoonApiTransportZones, Zone } from "node-roon-api-transport";

export class TransportService {
  constructor(private transportApi: RoonApiTransport) {}

  async getZones(): Promise<Zone[]> {
    return new Promise((resolve, reject) => {
      let settled = false;

      this.transportApi.subscribe_zones((response, body: RoonApiTransportZones) => {
        // Roon subscription callback pattern:
        // First call:    ('Subscribed', { zones: [...] })
        // Updates:       ({ zones: [...] })
        // Errors:        ('ErrorMessage')
        if (settled) {
          return;
        }

        if (response === "Unsubscribed") {
          settled = true;
          reject(new Error("Zone subscription ended before zones were received"));
          return;
        }

        const zones = body.zones;
        if (zones) {
          settled = true;
          resolve(zones);
        }
      });
    });
  }
}
