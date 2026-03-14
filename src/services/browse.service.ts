import type RoonApiBrowse from "node-roon-api-browse";
import type {
  ImageConfig,
  BrowseItemExtended,
  BrowseResult,
  LoadResult,
  BrowseItem,
} from "../types/config";

export class BrowseService {
  constructor(
    private browseApi: typeof RoonApiBrowse.prototype,
    private imageConfig: ImageConfig,
    private coreIp: string,
    private roonPort: number,
  ) {}

  async browse(opts: any): Promise<BrowseResult> {
    return new Promise((resolve, reject) => {
      (this.browseApi as any).browse(
        opts,
        (err: string | false, result: BrowseResult) => {
          if (err) reject(new Error(err));
          else resolve(result);
        },
      );
    });
  }

  async load(opts: any): Promise<LoadResult> {
    return new Promise((resolve, reject) => {
      (this.browseApi as any).load(
        opts,
        (err: string | false, result: LoadResult) => {
          if (err) reject(new Error(err));
          else resolve(result);
        },
      );
    });
  }

  buildImageUrl(imageKey: string): string {
    const { width, height, scale, format } = this.imageConfig;
    return `http://${this.coreIp}:${this.roonPort}/api/image/${imageKey}?scale=${scale}&width=${width}&height=${height}&format=${encodeURIComponent(format)}`;
  }

  extendItemsWithArtwork(items: BrowseItem[]): BrowseItemExtended[] {
    return items.map((item) => ({
      title: item.title,
      subtitle: item.subtitle,
      itemKey: item.item_key,
      hint: item.hint,
      artworkUrl: item.image_key
        ? this.buildImageUrl(item.image_key)
        : undefined,
    }));
  }
}
