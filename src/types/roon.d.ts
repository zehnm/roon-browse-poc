declare module "node-roon-api" {
  class RoonApi {
    constructor(options: {
      extension_id: string;
      display_name: string;
      display_version: string;
      publisher: string;
      email: string;
      website?: string;
      core_found?: (core: RoonCore) => void;
      core_lost?: (core: RoonCore) => void;
      core_paired?: (core: RoonCore) => Promise<void>;
      core_unpaired?: (core: RoonCore) => void;
    });
    init_services(opts: {
      required_services?: unknown[];
      provided_services?: unknown[];
    }): void;
    start_discovery(): void;
    ws_connect(opts: {
      host: string;
      port: number;
      onclose?: () => void;
    }): void;
  }

  interface RoonCore {
    core_id: string;
    display_name: string;
    display_version: string;
    services: Record<string, unknown>;
  }

  export = RoonApi;
}

declare module "node-roon-api-browse" {
  class RoonApiBrowse {
    browse(opts: any, cb: (err: string | false, result: any) => void): void;
    load(opts: any, cb: (err: string | false, result: any) => void): void;
  }
  export = RoonApiBrowse;
}

declare module "node-roon-api-transport" {
  interface Zone {
    zone_id: string;
    display_name: string;
    outputs: any[];
    state: string;
    [key: string]: any;
  }

  class RoonApiTransport {
    subscribe_zones(cb: (err: string | false, msg: any) => void): void;
    get_zones(cb: (zones: Zone[]) => void): void;
    control(
      zone: Zone,
      action: string,
      cb?: (err: string | false) => void,
    ): void;
  }
  export = RoonApiTransport;
}

declare module "node-roon-api-image" {
  class RoonApiImage {
    get_image(
      image_key: string,
      opts: {
        scale?: string;
        width?: number;
        height?: number;
        format?: string;
      },
      cb: (err: string | false, contentType: string, buffer: Buffer) => void,
    ): void;
  }
  export = RoonApiImage;
}

declare module "node-roon-api-status" {
  class RoonApiStatus {
    constructor(roon: unknown);
    set_status(message: string, is_error: boolean): void;
  }
  export = RoonApiStatus;
}
