import { Sub, relayInit, Relay, Event, Filter } from "nostr-tools";
import { DEFAULT_RELAYS, RELAYS_STORAGE_KEY } from "../constants";
import { MaybeLocalStorage, NostrEvent } from "../types";

const relays: Relay[] = [];
globalThis.relays = relays;
let connectedPromise: Promise<void | void[]>;

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
}: { urls?: string[] } = {}): Promise<void> => {
  if (typeof connectedPromise !== "undefined") {
    // NOTE: We need to cast here because TypeScript doesn't know if this will
    // be an array or a single void and so it complains. In reality, we don't
    // care, we just want to await this promise and ignore it's output.
    return connectedPromise as Promise<void>;
  }
  // Ensure this is only invoked once
  if (relays.length > 0) {
    return;
  }

  // Use the result from `getRelays()` if `urls` is not provided
  const realUrls = urls.length === 0 ? await getRelays() : urls;

  const connectionPromises = realUrls.map(async (url) => {
    const relay = relayInit(url);
    try {
      await relay.connect();
    } catch (error) {
      console.error("#b9aLfB Connecting to relay failed", relay.url, error);
      return;
    }
    relays.push(relay);
  });

  connectedPromise = Promise.all(connectionPromises);
  await connectedPromise;

  if (relays.length === 0) {
    console.error("#qDRSs5 All relays failed to connect");
    globalThis.alert(
      "Error: All relays failed to connect. Please wait a minute and reload."
    );
  }
};

export const _publish = (event: Event): Promise<void>[] => {
  const publishPromises = relays.map((relay) => {
    return new Promise<void>((resolve, reject) => {
      const pub = relay.publish(event);
      pub.on("ok", () => resolve());
      pub.on("failed", (reason) => reject(`${relay.url} - ${reason}`));
    });
  });
  return publishPromises;
};

type SubscribeParams = {
  filters: Filter[];
  onEvent: (event: NostrEvent) => void;
};
export const _subscribe = async ({
  filters,
  onEvent,
}: SubscribeParams): Promise<Promise<Sub>[]> => {
  await _initRelays();
  const subscriptions = relays.map(
    (relay) =>
      new Promise<Sub>((resolve, reject) => {
        const subscription = relay.sub(filters);
        subscription.on("event", onEvent);
        subscription.on("eose", () => {
          resolve(subscription);
        });
      })
  );

  return subscriptions;
};

export const createRelays = async () => {
  const relaysInstalled = await hasRelays();
  if (!relaysInstalled) {
    await setRelays({ relays: DEFAULT_RELAYS });
  }
};
