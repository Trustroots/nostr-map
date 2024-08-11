import { Event, getPublicKey } from "nostr-tools";
import {
  CONTENT_MAXIMUM_LENGTH,
  CONTENT_MINIMUM_LENGTH,
  LABEL_NAMESPACE_TAG,
  MAP_NOTE_KIND,
  MAP_NOTE_REPOST_KIND,
  OPEN_LOCATION_CODE_NAMESPACE_TAG,
  PLUS_CODE_TAG_KEY,
  POST_ACCEPTANCE_TIMEOUT_SECONDS,
  POST_VALIDATION_TIMEOUT_SECONDS,
  TRUSTED_VALIDATION_PUBKEYS,
} from "../constants";
import { UnsignedEvent } from "../types";
import { getPrivateKey } from "./keys";
import { _publish } from "./relays";
import { getTagFirstValueFromEvent, signEventWithPrivateKey } from "./utils";
import { getKind30398Events } from "./subscribe";
import { alert, promiseWithTimeout } from "../utils";

type CreateNoteParams = {
  /** The content of the note to publish on the map */
  content: string;
  /** The plus code (location) of the note */
  plusCode: string;
  privateKey?: string;
  expirationDate?: number;
};
export const createNote = async ({
  content,
  plusCode,
  privateKey,
  expirationDate,
}: CreateNoteParams) => {
  const key =
    typeof privateKey === "undefined" ? await getPrivateKey() : privateKey;

  if (
    content.length < CONTENT_MINIMUM_LENGTH ||
    content.length > CONTENT_MAXIMUM_LENGTH
  ) {
    return;
  }

  const unsignedEvent: UnsignedEvent = {
    kind: MAP_NOTE_KIND,
    content,
    tags: [
      [LABEL_NAMESPACE_TAG, OPEN_LOCATION_CODE_NAMESPACE_TAG],
      [PLUS_CODE_TAG_KEY, plusCode, OPEN_LOCATION_CODE_NAMESPACE_TAG],
    ],
  };

  if (expirationDate) {
    unsignedEvent.tags.push(["expiration", `${expirationDate}`]);
  }
  const signedEvent = signEventWithPrivateKey({
    unsignedEvent,
    privateKey: key,
  });

  try {
    await promiseWithTimeout(
      _publish(signedEvent),
      POST_ACCEPTANCE_TIMEOUT_SECONDS * 1000
    );
  } catch (e) {
    alert(
      `Your post was not accepted by our relay pool. Please choose different relays or try again later.`
    );
    console.error(e);
  }

  setTimeout(async () => {
    console.log(`Verifying that event ${signedEvent.id} got validated.`);
    const allKind30398Events = await getKind30398Events();
    const publicKey = getPublicKey(key);
    const events = await allKind30398Events.query([
      {
        kinds: [MAP_NOTE_REPOST_KIND],
        authors: TRUSTED_VALIDATION_PUBKEYS,
        "#p": [publicKey],
      },
    ]);
    const match = events.find(
      (event) =>
        getTagFirstValueFromEvent({ event, tag: "e" }) == signedEvent.id
    );
    if (!match) {
      alert(
        `Your post was published successfully, but not validated within ${POST_VALIDATION_TIMEOUT_SECONDS} seconds. Hopefully it will be soon!`
      );
    } else {
      console.log(`Event ${signedEvent.id} got validated.`);
    }
  }, POST_VALIDATION_TIMEOUT_SECONDS * 1000);
};

globalThis.createNote = createNote;
