// Most definitions taken from https://github.com/Stevenic/roon-kit/blob/main/packages/roon-kit/src/interfaces.ts
// MIT license

declare module "node-roon-api" {
  import type RoonApiImage from "node-roon-api-image";
  import type RoonApiTransport from "node-roon-api-transport";
  import type RoonApiBrowse from "node-roon-api-browse";
  export type EmptyObject = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [K in any]: never;
  };

  export interface RoonExtensionDescription {
    extension_id: string;
    display_name: string;
    display_version: string;
    publisher: string;
    email: string;
    website?: string;
  }

  export interface RoonApiOptions extends RoonExtensionDescription {
    log_level?: "none" | "all" | "quiet";
    core_paired?: (core: RoonCore) => void;
    core_unpaired?: (core: RoonCore) => void;
    core_found?: (core: RoonCore) => void;
    core_lost?: (core: RoonCore) => void;
  }

  export interface WSConnectOptions {
    host: string;
    port: number;
    onclose?: () => void;
  }

  export type RoonSubscriptionResponse = "Subscribed" | "Changed" | "Unsubscribed";

  class RoonApi {
    constructor(options: RoonApiOptions);
    init_services(opts: { required_services?: unknown[]; provided_services?: unknown[] }): void;
    start_discovery(): void;
    ws_connect(opts: WSConnectOptions): void;
  }

  export interface RoonCore {
    core_id: string;
    display_name: string;
    display_version: string;
    services: {
      readonly RoonApiBrowse: RoonApiBrowse;
      readonly RoonApiImage: RoonApiImage;
      readonly RoonApiTransport: RoonApiTransport;
    };
  }

  export default RoonApi;
}

declare module "node-roon-api-browse" {
  export interface RoonApiBrowseOptions {
    hierarchy: RoonApiBrowseHierarchy;
    multi_session_key?: string;
    item_key?: string;
    input?: string;
    zone_or_output_id?: string;
    pop_all?: boolean;
    pop_levels?: number;
    refresh_list?: boolean;
    set_display_offset?: number;
  }

  export type RoonApiBrowseHierarchy =
    | "browse"
    | "playlists"
    | "settings"
    | "internet_radio"
    | "albums"
    | "artists"
    | "genres"
    | "composers"
    | "search";

  export interface RoonApiBrowseResponse {
    action: string;
    item?: Item;
    list?: List;
    message?: string;
    is_error?: boolean;
  }

  export interface Item {
    title: string;
    subtitle?: string;
    image_key?: string;
    item_key?: string;
    hint?: ItemHint | null;
    input_prompt?: {
      prompt: string;
      action: string;
      value?: string;
      is_password?: boolean;
    };
  }

  export type ItemHint = "action" | "action_list" | "list" | "header";

  export interface List {
    title: string;
    count: number;
    subtitle?: string;
    image_key?: string;
    level: number;
    display_offset?: number;
    hint?: ListHint | null;
  }

  export type ListHint = "action_list";

  export interface RoonApiBrowseLoadOptions {
    set_display_offset?: number;
    level?: number;
    offset?: number;
    count?: number;
    hierarchy: RoonApiBrowseHierarchy;
    multi_session_key?: string;
  }

  export interface RoonApiBrowseLoadResponse {
    items: Item[];
    offset: number;
    list: List;
  }

  export type RoonBrowseCallback = (err: string | false, result: RoonApiBrowseResponse) => void;

  export type RoonLoadCallback = (err: string | false, result: RoonApiBrowseLoadResponse) => void;

  class RoonApiBrowse {
    browse(options: RoonApiBrowseOptions, cb: RoonBrowseCallback): void;
    load(options: RoonApiBrowseLoadOptions, cb: RoonLoadCallback): void;
  }
  export default RoonApiBrowse;
}

declare module "node-roon-api-transport" {
  import type { EmptyObject, RoonSubscriptionResponse } from "node-roon-api";
  import type { Item } from "node-roon-api-browse";

  export interface Zone {
    zone_id: string;
    display_name: string;
    outputs: Output[];
    state: RoonPlaybackState;
    seek_position?: number;
    is_previous_allowed: boolean;
    is_next_allowed: boolean;
    is_pause_allowed: boolean;
    is_play_allowed: boolean;
    is_seek_allowed: boolean;
    queue_items_remaining?: number;
    queue_time_remaining?: number;
    settings?: ZoneSettings;
    now_playing?: ZoneNowPlaying;
  }

  export type RoonPlaybackState = "playing" | "paused" | "loading" | "stopped";

  export interface ZoneSettings {
    loop: ZoneLoopSettings;
    shuffle: boolean;
    auto_radio: boolean;
  }

  export type ZoneLoopSettings = "loop" | "loop_one" | "disabled";

  export interface ZoneNowPlaying {
    seek_position?: number;
    length?: number;
    image_key?: string;
    one_line: {
      line1: string;
    };
    two_line: {
      line1: string;
      line2?: string;
    };
    three_line: {
      line1: string;
      line2?: string;
      line3?: string;
    };
  }

  export interface Output {
    output_id: string;
    zone_id: string;
    can_group_with_output_ids: string[];
    display_name: string;
    state?: RoonPlaybackState;
    source_controls?: OutputSourceControls[];
    volume?: OutputVolumeControl;
  }

  export interface OutputSourceControls {
    control_key: string;
    display_name: string;
    status: OutputSourceControlStatus;
    supports_standby: boolean;
  }

  export type OutputSourceControlStatus = "selected" | "deselected" | "standby" | "indeterminate";

  export interface OutputVolumeControl {
    type?: OutputVolumeControlType | string;
    min?: number;
    max?: number;
    value?: number;
    step?: number;
    is_muted?: boolean;
  }

  export type OutputVolumeControlType = "number" | "db" | "incremental";

  export interface RoonApiTransportSettings {
    shuffle?: boolean;
    auto_radio?: boolean;
    loop?: RoonLoopOptions;
  }

  export type RoonLoopOptions = "loop" | "loop_one" | "disabled" | "next";

  export type RoonChangeVolumeHow = "absolute" | "relative" | "relative_step";

  export type RoonApiTransportControl = "play" | "pause" | "playpause" | "stop" | "previous" | "next";

  export interface RoonApiTransportConvenienceSwitchOptions {
    control_key?: string;
  }

  export type RoonMuteHow = "mute" | "unmute";

  export type RoonSeekHow = "relative" | "absolute";

  export interface RoonApiTransportStandbyOptions {
    control_key?: string;
  }

  export interface RoonApiTransportOutputs {
    outputs: Output[];
  }

  export interface RoonApiTransportZones {
    zones?: Zone[];
    zones_added?: Zone[];
    zones_changed?: Zone[];
    zones_removed?: Zone[];
    zones_seek_changed?: Pick<Zone, "zone_id" | "queue_time_remaining" | "seek_position">[];
  }

  export interface RoonApiTransportQueue {
    items: Item[];
  }

  export type RoonApiTransportResultCallback = (err: string | false) => void;

  export type RoonApiTransportOutputsCallback = (err: string | false, body: RoonApiTransportOutputs) => void;

  export type RoonApiTransportZonesCallback = (err: string | false, body: RoonApiTransportZones) => void;

  export type RoonApiTransportPlayFromHereCallback = (err: string | false, body: RoonApiTransportQueue) => void;

  export type RoonApiTransportOutputSubscriptionCallback = (
    response: RoonSubscriptionResponse,
    body: RoonApiTransportOutputs,
  ) => void;

  export type RoonApiTransportZonesSubscriptionCallback = (
    response: RoonSubscriptionResponse,
    body: RoonApiTransportZones,
  ) => void;

  export type RoonApiTransportQueueSubscriptionCallback = (
    response: RoonSubscriptionResponse,
    body: RoonApiTransportQueue,
  ) => void;

  class RoonApiTransport {
    change_settings(zone: Zone | Output, settings: RoonApiTransportSettings, cb?: RoonApiTransportResultCallback): void;
    change_volume(output: Output, how: RoonChangeVolumeHow, value: number, cb?: RoonApiTransportResultCallback): void;
    control(zone: Zone | Output, control: RoonApiTransportControl, cb?: RoonApiTransportResultCallback): void;
    convenience_switch(
      output: Output,
      opts: RoonApiTransportConvenienceSwitchOptions | EmptyObject,
      cb?: RoonApiTransportResultCallback,
    ): void;
    get_outputs(cb: RoonApiTransportOutputsCallback): void;
    get_zones(cb: RoonApiTransportZonesCallback): void;
    group_outputs(outputs: Output[], cb?: RoonApiTransportResultCallback): void;
    mute(output: Output, how: RoonMuteHow, cb?: RoonApiTransportResultCallback): void;
    mute_all(how: RoonMuteHow, cb?: RoonApiTransportResultCallback): void;
    pause_all(cb?: RoonApiTransportResultCallback): void;
    play_from_here(zone: Zone | Output, queue_item_id: string, cb?: RoonApiTransportPlayFromHereCallback): void;
    seek(zone: Zone | Output, how: RoonSeekHow, seconds: number, cb?: RoonApiTransportResultCallback): void;
    standby(output: Output, opts: RoonApiTransportStandbyOptions, cb?: RoonApiTransportResultCallback): void;
    subscribe_outputs(cb: RoonApiTransportOutputSubscriptionCallback): void;
    subscribe_queue(zone: Zone | Output, max_item_count: number, cb: RoonApiTransportQueueSubscriptionCallback): void;
    subscribe_zones(cb: RoonApiTransportZonesSubscriptionCallback): void;
    toggle_standby(output: Output, opts: RoonApiTransportStandbyOptions, cb?: RoonApiTransportResultCallback): void;
    transfer_zone(fromzone: Zone | Output, tozone: Zone | Output, cb?: RoonApiTransportResultCallback): void;
    ungroup_outputs(outputs: Output[], cb?: RoonApiTransportResultCallback): void;
    zone_by_zone_id(zone_id: string): Zone | null;
    zone_by_output_id(output_id: string): Zone | null;
    zone_by_object(zone: Zone | Output): Zone | null;
  }

  export default RoonApiTransport;
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
  export default RoonApiImage;
}

declare module "node-roon-api-status" {
  class RoonApiStatus {
    constructor(roon: unknown);
    set_status(message: string, is_error: boolean): void;
  }
  export default RoonApiStatus;
}
