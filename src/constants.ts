import { Kind } from "nostr-tools";

export const PRIVATE_KEY_STORAGE_KEY = "__nostrPrivateKey" as const;
export const RELAYS_STORAGE_KEY = "__nostrRelays" as const;
export const PLUS_CODE_TAG_KEY = "l" as const;
export const MAP_NOTE_KIND = 397 as Kind;
export const DEFAULT_RELAYS = [
  "wss://relay.primal.net",
  "wss://relay.damus.io",
  "wss://nostr.manasiwibi.com",
];
export const PANEL_CONTAINER_ID = "panelID";
export const BADGE_CONTAINER_ID = "badge";
export const CONTENT_MINIMUM_LENGTH = 3;
export const CONTENT_MAXIMUM_LENGTH = 300;
