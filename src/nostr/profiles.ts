import { Kind, nip19 } from "nostr-tools";
import { MaybeLocalStorage, Profile, UnsignedEvent } from "../types";
import { getPrivateKey } from "./keys";
import { _publish, _subscribe } from "./relays";
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
    const publishPromises = _publish(signedEvent);
    await Promise.all(publishPromises);
  } catch (error) {
    const message = "#mkox3R Error saving profile";
    console.error(message, error);
    throw error;
  }
};

type GetProfileParams = {
  /** The public key of the user to fetch their profile */
  publicKey: string;
};
export const subscribeAndGetProfile = async ({
  publicKey,
}: GetProfileParams) => {
  return new Promise<Profile>((resolve, reject) => {
    const subscriptions = _subscribe({
      filters: [
        {
          kinds: [Kind.Metadata],
          authors: [publicKey],
        },
      ],
      onEvent: (event) => {
        try {
          const profile = getProfileFromEvent({ event });
          // NOTE: This will be called multiple times, but any calls after the
          // first are ignored
          resolve(profile);
        } catch (error) {
          console.error("#P0haKt Failed to get profile from event", error);
        }
      },
    });

    // Timeout after 2s. This is a no-op if the promise already resolved above.
    setTimeout(() => {
      const npubPublicKey = nip19.npubEncode(publicKey);
      resolve({
        publicKey,
        npubPublicKey,
        name: "",
        trustrootsUsername: "",
        about: "",
        picture: "",
      });
    }, 2e3);
  });
};
