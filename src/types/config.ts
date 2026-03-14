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

export interface BrowseItemExtended {
  title: string;
  subtitle?: string;
  itemKey?: string;
  hint?: string;
  artworkUrl?: string;
}

export interface BrowseResult {
  action: "none" | "list" | "message" | "replace_item" | "remove_item";
  list?: {
    title: string;
    subtitle?: string;
    count: number;
    level: number;
    display_offset?: number;
  };
  item?: any;
  message?: string;
  is_error?: boolean;
}

export interface LoadResult {
  items: BrowseItem[];
  offset: number;
  list: {
    title: string;
    count: number;
    level: number;
  };
}

export interface BrowseItem {
  title: string;
  subtitle?: string;
  image_key?: string;
  item_key?: string;
  hint?: "action" | "action_list" | "list" | "header";
}

export interface Zone {
  zone_id: string;
  display_name: string;
  outputs: any[];
  state: "playing" | "paused" | "loading" | "stopped";
  [key: string]: any;
}
