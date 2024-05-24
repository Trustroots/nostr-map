import { Kind, Filter, nip19 } from "nostr-tools";
import { MAP_NOTE_KIND, PLUS_CODE_TAG_KEY } from "../constants";
import { NostrEvent, Note, Profile } from "../types";
import { _subscribe } from "./relays";
import {
  doesStringPassSanitisation,
  getProfileFromEvent,
  getPublicKeyFromEvent,
  getTagFirstValueFromEvent,
  isDev,
  isValidPlusCode,
  uniq,
} from "./utils";
import { isValidAttribute } from "dompurify";

const eventToNoteMinusProfile = ({
  event,
}: {
  event: NostrEvent;
}): Omit<
  Note,
  "authorName" | "authorTrustrootsUsername" | "authorTripHoppingUserId"
> => {
  const { id, kind, content } = event;
  // NOTE: We need to cast `note.kind` here because the `NostrEvent` type has a
  // enum for Kinds, which doesn't include our custom kind.
  if ((kind as number) !== MAP_NOTE_KIND) {
    throw new Error("#w27ijD Cannot convert event of wrong kind to note");
  }

  const plusCode = getTagFirstValueFromEvent({ event, tag: PLUS_CODE_TAG_KEY });
  if (typeof plusCode === "undefined") {
    throw new Error("#C7a4Ck Cannot convert invalid event to note");
  }

  const publicKey = getPublicKeyFromEvent({ event });
  const authorNpubPublicKey = nip19.npubEncode(publicKey);

  return {
    id,
    authorPublicKey: publicKey,
    authorNpubPublicKey,
    content,
    plusCode,
  };
};

const eventToNote = ({
  event,
  profiles,
}: {
  event: NostrEvent;
  profiles: { [publicKey: string]: Profile };
}): Note => {
  const baseNote = eventToNoteMinusProfile({ event });
  const profile = profiles[baseNote.authorPublicKey];
  const authorName = profile?.name || "";
  const authorTrustrootsUsername = profile?.trustrootsUsername || "";
  const authorTripHoppingUserId = profile?.tripHoppingUserId || "";
  return {
    ...baseNote,
    authorName,
    authorTrustrootsUsername,
    authorTripHoppingUserId,
  };
};

type SubscribeParams = {
  /** The public key of the user to fetch events for, or undefined to fetch events from all users */
  publicKey?: string;
  /** The maximum number of notes to fetch
   * @default 200
   */
  limit?: number;
  onNoteReceived: (note: Note) => void;
};
export const subscribe = async ({
  publicKey,
  onNoteReceived,
  limit = 200,
}: SubscribeParams) => {
  console.log("#qnvvsm nostr/subscribe", publicKey);
  let gotNotesEose = false;
  let gotPromiseEose = false;
  const profiles: { [publicKey: string]: Profile } = {};

  const getEventsForSpecificAuthor = typeof publicKey !== "undefined";

  const eventsBaseFilter = { kinds: [MAP_NOTE_KIND] };

  const eventsFilter: Filter = getEventsForSpecificAuthor
    ? { ...eventsBaseFilter, authors: [publicKey] }
    : eventsBaseFilter;
  const eventsFilterWithLimit = { ...eventsFilter, limit };

  const noteEventsQueue: NostrEvent[] = [];

  const onNoteEvent = (event: NostrEvent) => {
    if (isDev()) console.log("#gITVd2 gotNoteEvent", event);

    if (
      !doesStringPassSanitisation(event.content) ||
      !doesStringPassSanitisation(event.pubkey)
    ) {
      return;
    }

    const plusCode = getTagFirstValueFromEvent({
      event,
      tag: PLUS_CODE_TAG_KEY,
    });
    if (!isValidPlusCode(plusCode)) {
      return;
    }

    if (!gotNotesEose || !gotPromiseEose) {
      noteEventsQueue.push(event);
      return;
    }

    const note = eventToNote({ event, profiles });
    onNoteReceived(note);
  };

  const noteSubscriptions = _subscribe({
    filters: [eventsFilterWithLimit],
    onEvent: onNoteEvent,
  });
  await Promise.race(await noteSubscriptions);
  gotNotesEose = true;

  const authorsWithDuplicates = noteEventsQueue.map((event) =>
    getPublicKeyFromEvent({ event })
  );
  const authors = uniq(authorsWithDuplicates);
  const profileFilter: Filter = {
    kinds: [Kind.Metadata],
    authors,
  };

  const onProfileEvent = (event: NostrEvent) => {
    if (isDev()) console.log("#zD1Iau got profile event", event);

    const profile = getProfileFromEvent({ event });
    const publicKey = getPublicKeyFromEvent({ event });

    if (
      !doesStringPassSanitisation(profile.name) ||
      !doesStringPassSanitisation(profile.about) ||
      !doesStringPassSanitisation(profile.trustrootsUsername) ||
      profile.trustrootsUsername === "edit" ||
      !doesStringPassSanitisation(profile.tripHoppingUserId) ||
      !doesStringPassSanitisation(publicKey)
    ) {
      return;
    }

    profiles[publicKey] = profile;
  };

  const profileSubscriptions = _subscribe({
    filters: [profileFilter],
    onEvent: onProfileEvent,
  });
  await Promise.race(await profileSubscriptions);
  gotPromiseEose = true;

  // NOTE: At this point we should have fetched all the stored events, and all
  // the profiles of the authors of all of those events
  const notes = noteEventsQueue.map((event) =>
    eventToNote({ event, profiles })
  );

  notes.forEach((note) => onNoteReceived(note));
};
