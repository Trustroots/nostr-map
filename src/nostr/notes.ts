import { Event } from "nostr-tools";
import {
  CONTENT_MAXIMUM_LENGTH,
  CONTENT_MINIMUM_LENGTH,
  LABEL_NAMESPACE_TAG,
  MAP_NOTE_REPOST_KIND,
  OPEN_LOCATION_CODE_NAMESPACE_TAG,
  PLUS_CODE_TAG_KEY,
} from "../constants";
import { UnsignedEvent } from "../types";
import { getPrivateKey } from "./keys";
import { _publish } from "./relays";
import { signEventWithPrivateKey } from "./utils";

type CreateNoteParams = {
  /** The content of the note to publish on the map */
  content: string;
  /** The plus code (location) of the note */
  plusCode: string;
  privateKey?: string;
};
export const createNote = async ({
  content,
  plusCode,
  privateKey,
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
    kind: MAP_NOTE_REPOST_KIND,
    content,
    tags: [
      [LABEL_NAMESPACE_TAG, OPEN_LOCATION_CODE_NAMESPACE_TAG],
      [PLUS_CODE_TAG_KEY, plusCode, OPEN_LOCATION_CODE_NAMESPACE_TAG],
    ],
  };
  const signedEvent = signEventWithPrivateKey({
    unsignedEvent,
    privateKey: key,
  });
  _publish(signedEvent);
  // TODO - How do we wait for the SEEN here?
};

globalThis.createNote = createNote;
