import { Kind } from "nostr-tools";

export const PRIVATE_KEY_STORAGE_KEY = "__nostrPrivateKey" as const;
export const RELAYS_STORAGE_KEY = "__nostrRelays" as const;
export const PLUS_CODE_TAG_KEY = "l" as const;
export const LABEL_NAMESPACE_TAG = "L";
export const OPEN_LOCATION_CODE_NAMESPACE_TAG = "open-location-code";
export const MAP_NOTE_KIND = 397 as Kind;
export const MAP_NOTE_REPOST_KIND = 30398 as Kind;
export const DEFAULT_RELAYS = [
  "wss://relay.primal.net",
  "wss://relay.damus.io",
  "wss://nostr.manasiwibi.com",
  "wss://nos.lol",
];
// Dev vs production relays don't work because relays copy from each other.
export const DEV_RELAYS = DEFAULT_RELAYS;
export const PANEL_CONTAINER_ID = "panelID";
export const BADGE_CONTAINER_ID = "badge";

export {
  CONTENT_MAXIMUM_LENGTH,
  CONTENT_MINIMUM_LENGTH,
} from "@shuesken/nostroots-kind30398event";

export const EARLIEST_FILTER_SINCE = 1716736622;

export const TRUSTED_VALIDATION_PUBKEYS = [
  "f5bc71692fc08ea52c0d1c8bcfb87579584106b5feb4ea542b1b8a95612f257b",
];

export const HITCHMAPS_AUTHOR_PUBLIC_KEY =
  "53055ee011e96a00a705b38253b9cbc6614ccbd37df4dad42ec69bbe608c4209" as const;

export const TRUSTROOTS_NPUB_PUT_URL = "https://www.trustroots.org/api/users";
export const TRUSTROOTS_NIP5_URL =
  "https://www.trustroots.org/.well-known/nostr.json";

export const POST_VALIDATION_TIMEOUT_SECONDS = 5;
export const POST_ACCEPTANCE_TIMEOUT_SECONDS = 5;
