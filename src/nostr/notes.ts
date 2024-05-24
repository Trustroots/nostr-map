import { Event } from "nostr-tools";
import {
  CONTENT_MAXIMUM_LENGTH,
  CONTENT_MINIMUM_LENGTH,
  MAP_NOTE_KIND,
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
    kind: MAP_NOTE_KIND,
    content,
    tags: [[PLUS_CODE_TAG_KEY, plusCode]],
  };
  const signedEvent = signEventWithPrivateKey({
    unsignedEvent,
    privateKey: key,
  });
  _publish(signedEvent);
  // TODO - How do we wait for the SEEN here?
};

globalThis.createNote = createNote;
