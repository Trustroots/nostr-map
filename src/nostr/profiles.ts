import { Kind, nip19 } from "nostr-tools";
import { MaybeLocalStorage, Profile, UnsignedEvent } from "../types";
import { getPrivateKey } from "./keys";
import { _publish, _query } from "./relays";
import {
  getProfileFromEvent,
  sanitise,
  signEventWithPrivateKey,
} from "./utils";

type SetProfileParams = {
  /** The user's name to be sent to all relays */
  name: string;
  /** A longer string that may (later) be shown on the user's profile page */
  about: string;
  /** The user's (unverified) trustroots username */
  trustrootsUsername: string;
  /** The private key of the user, optionally fetched from localStorage */
  privateKey?: string;
} & MaybeLocalStorage;
export const setProfile = async ({
  name,
  about,
  trustrootsUsername,
  privateKey,
  localStorage,
}: SetProfileParams) => {
  const key =
    typeof privateKey !== "undefined"
      ? privateKey
      : await getPrivateKey({ localStorage });

  const sanitisedProfile = {
    name: sanitise(name),
    about: sanitise(about),
    trustrootsUsername: sanitise(trustrootsUsername),
  };

  const content = JSON.stringify(sanitisedProfile);
  const unsignedEvent: UnsignedEvent = {
    kind: Kind.Metadata,
    content,
    tags: [],
  };
  const signedEvent = signEventWithPrivateKey({
    unsignedEvent,
    privateKey: key,
  });
  try {
    const publishPromises = await _publish(signedEvent);
  } catch (error) {
    const message = "#mkox3R Error saving profile";
    console.error(message, error);
    throw error;
  }
};
