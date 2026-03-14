import RoonApiBrowse from "node-roon-api-browse";
import type {
  Item,
  RoonApiBrowseLoadOptions,
  RoonApiBrowseLoadResponse,
  RoonApiBrowseOptions,
  RoonApiBrowseResponse,
} from "node-roon-api-browse";
import type { ImageConfig, BrowseItem } from "../types/config.js";

export class BrowseService {
  constructor(
    private browseApi: RoonApiBrowse,
    private imageConfig: ImageConfig,
    private coreIp: string,
    private roonPort: number,
  ) {}

  browse(opts: RoonApiBrowseOptions): Promise<RoonApiBrowseResponse> {
    return new Promise((resolve, reject) => {
      this.browseApi.browse(opts, (err, result) => {
        if (err) {
          reject(new Error(err));
          return;
        }
        resolve(result);
      });
    });
  }

  load(opts: RoonApiBrowseLoadOptions): Promise<RoonApiBrowseLoadResponse> {
    return new Promise((resolve, reject) => {
      this.browseApi.load(opts, (err, result) => {
        if (err) {
          reject(new Error(err));
          return;
        }
        resolve(result);
      });
    });
  }

  buildImageUrl(imageKey: string): string {
    const { width, height, scale, format } = this.imageConfig;
    return `http://${this.coreIp}:${this.roonPort}/api/image/${imageKey}?scale=${scale}&width=${width}&height=${height}&format=${encodeURIComponent(format)}`;
  }

  extendItemsWithArtwork(items: Item[]): BrowseItem[] {
    return items.map((item) => ({
      title: item.title,
      subtitle: item.subtitle,
      itemKey: item.item_key,
      hint: item.hint,
      artworkUrl: item.image_key ? this.buildImageUrl(item.image_key) : undefined,
    }));
  }
}
