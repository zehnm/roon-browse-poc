export interface ImageConfig {
  width: number;
  height: number;
  scale: "fit" | "fill" | "stretch";
  format: "image/jpeg" | "image/png";
}

export interface CliArgs {
  core?: string; // IP address (only for advanced mode)
  port?: number; // WebSocket port (only for advanced mode)
  zone?: string;
  levels: number;
  limit: number;
  play?: string;
}

export interface AppConfig extends CliArgs {
  imageConfig: ImageConfig;
  roonPort: number;
  coreIp?: string;
  selectedZoneId?: string;
}

/**
 * An extended version of the Roon API browse item.
 * Includes the artwork URL and the item key.
 */
export interface BrowseItem {
  title: string;
  subtitle?: string;
  itemKey?: string;
  hint?: string | null;
  artworkUrl?: string;
}
