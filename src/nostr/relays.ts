import { Event, Filter, Relay, Sub, relayInit } from "nostr-tools";
import { DEFAULT_RELAYS, DEV_RELAYS, RELAYS_STORAGE_KEY } from "../constants";
import { MaybeLocalStorage, NostrEvent } from "../types";
import { isDev } from "./utils";
import * as nostrify from "@nostrify/nostrify";

let globalRelayPool: nostrify.NPool;

/**
 * Get the list of relays we're connecting to
 */
export const getRelays = async ({
  localStorage = globalThis.localStorage,
}: MaybeLocalStorage = {}): Promise<string[]> => {
  const relaysJSONMaybe = localStorage.getItem(RELAYS_STORAGE_KEY);
  if (relaysJSONMaybe === null || relaysJSONMaybe.length === 0) {
    throw new Error("#we8Qt4 No relays configured");
  }
  try {
    const relays = JSON.parse(relaysJSONMaybe);
    if (!Array.isArray(relays)) {
      throw new Error("#kSt3oN Relays is not an array of relays");
    }
    return relays as string[];
  } catch (error) {
    console.error("#TKE6Vm Error during JSON.parse()", error);
    throw error;
  }
};

export const hasRelays = async ({
  localStorage = globalThis.localStorage,
}: MaybeLocalStorage = {}): Promise<boolean> => {
  const relaysJson = localStorage.getItem(RELAYS_STORAGE_KEY);
  if (relaysJson === null) {
    return false;
  }
  try {
    const relays = JSON.parse(relaysJson);
    if (Array.isArray(relays)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
  return true;
};

type SetRelaysParams = {
  /** The relay URLs. NOTE: This overwrites ALL existing relays. */
  relays: string[];
};
export const setRelays = async ({
  relays,
  localStorage = globalThis.localStorage,
}: SetRelaysParams & MaybeLocalStorage): Promise<void> => {
  const relaysString = JSON.stringify(relays);
  localStorage.setItem(RELAYS_STORAGE_KEY, relaysString);
  return;
};

export const _initRelays = async ({
  urls = [],
}: { urls?: string[] } = {}): Promise<nostrify.NPool> => {
  // Ensure this is only invoked once
  if (globalRelayPool) {
    return globalRelayPool;
  }
  // Use the result from `getRelays()` if `urls` is not provided
  const realUrls = urls.length === 0 ? await getRelays() : urls;

  console.log(`Opening new NPool… with ${realUrls.join(", ")}`);

  const relayPool = new nostrify.NPool({
    open(url) {
      console.log(`Connecting to ${url}…`);
      return new nostrify.NRelay1(url, {
        backoff: false, // TODO the default here is ExponentialBackoff, we should use that
      });
    },
    async reqRouter(filter: nostrify.NostrFilter[]) {
      const map = new Map();
      realUrls.map((url) => {
        map.set(url, filter);
      });
      return map;
    },
    async eventRouter(_event) {
      return realUrls;
    },
  });
  globalRelayPool = relayPool;

  return relayPool;
};

export const _publish = async (event: NostrEvent): Promise<void> => {
  const relayPool = await _initRelays();
  return relayPool.event(event);
};

export const getDefaultRelays = () => {
  const relays = isDev() ? DEV_RELAYS : DEFAULT_RELAYS;
  return relays;
};

export const createRelays = async () => {
  const relaysInstalled = await hasRelays();
  if (!relaysInstalled) {
    const relays = getDefaultRelays();
    setRelays({ relays });
  }
};
