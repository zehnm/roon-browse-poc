import type { ImageConfig } from "../types/config";

export const IMAGE_CONFIG: ImageConfig = {
  width: 300,
  height: 300,
  scale: "fit",
  format: "image/jpeg",
};

export const ROON_API_PORT = 9330; // Default WebSocket API port (dynamic, but 9330 is typical)
export const ROON_IMAGE_PORT = 9100; // Image server port (fixed)
export const ROON_DISCOVERY_TIMEOUT_MS = 10000;
export const DEFAULT_BROWSE_LIMIT = 10;
export const DEFAULT_BROWSE_LEVELS = 2;
