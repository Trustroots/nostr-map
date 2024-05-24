import {
  generatePrivateKey,
  getPublicKey as getPublicKeyFromPrivateKey,
  nip19,
} from "nostr-tools";
import { PRIVATE_KEY_STORAGE_KEY } from "../constants";
import { MaybeLocalStorage } from "../types";

export const getPrivateKey = async ({
  localStorage = globalThis.localStorage,
}: MaybeLocalStorage = {}) => {
  const privateKeyMaybe = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
  if (privateKeyMaybe === null || privateKeyMaybe.length !== 64) {
    throw new Error("#lvYBhM Cannot find private key");
  }
  return privateKeyMaybe;
};

export const getNsecPrivateKey = async ({
  localStorage = globalThis.localStorage,
}: MaybeLocalStorage = {}): Promise<string> => {
  const privateKey = await getPrivateKey();
  const nsecPrivateKey = nip19.nsecEncode(privateKey);
  return nsecPrivateKey;
};

export const hasPrivateKey = async ({
  localStorage = globalThis.localStorage,
}: MaybeLocalStorage = {}) => {
  try {
    await getPrivateKey();
    return true;
  } catch {}
  return false;
};

export const getPublicKey = async ({
  localStorage = globalThis.localStorage,
}: MaybeLocalStorage = {}): Promise<string> => {
  const privateKey = await getPrivateKey({ localStorage });

  const publicKey = getPublicKeyFromPrivateKey(privateKey);

  return publicKey;
};

export const getNpubPublicKey = async ({
  localStorage = globalThis.localStorage,
}: MaybeLocalStorage = {}): Promise<string> => {
  const publicKey = await getPublicKey();
  const npubPublicKey = nip19.npubEncode(publicKey);
  return npubPublicKey;
};

type SetPrivateKeyParams = {
  /** The private key to store */
  privateKey: string;
};
export const setPrivateKey = async ({
  privateKey,
  localStorage = globalThis.localStorage,
}: SetPrivateKeyParams & MaybeLocalStorage) => {
  if (privateKey.length !== 64) {
    throw new Error("#irpzXh Private key is not 64 characters");
  }
  await localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKey);
};

export const createPrivateKey = async () => {
  const privateKey = generatePrivateKey();
  await setPrivateKey({ privateKey });
  return privateKey;
};

export const unsetPrivateKey = async ({
  localStorage = globalThis.localStorage,
}: MaybeLocalStorage = {}) => {
  await localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
};
