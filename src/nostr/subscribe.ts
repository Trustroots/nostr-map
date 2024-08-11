import { Kind, Filter, nip19 } from "nostr-tools";
import {
  CONTENT_MAXIMUM_LENGTH,
  EARLIEST_FILTER_SINCE,
  MAP_NOTE_REPOST_KIND,
  PLUS_CODE_TAG_KEY,
  TRUSTED_VALIDATION_PUBKEYS,
} from "../constants";
import {
  Kind30398Event,
  MetadataEvent,
  NostrEvent,
  Note,
  Profile,
} from "../types";
import { _initRelays, _query } from "./relays";
import {
  doesStringPassSanitisation,
  getProfileFromEvent,
  getPublicKeyFromEvent,
  getTagFirstValueFromEvent,
  isDev,
  isValidPlusCode,
  uniq,
} from "./utils";
import * as nostrify from "@nostrify/nostrify";

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
  if ((kind as number) !== MAP_NOTE_REPOST_KIND) {
    throw new Error("#w27ijD Cannot convert event of wrong kind to note");
  }

  const plusCode = getTagFirstValueFromEvent({ event, tag: PLUS_CODE_TAG_KEY });
  if (typeof plusCode === "undefined") {
    throw new Error("#C7a4Ck Cannot convert invalid event to note");
  }

  const publicKey = getPublicKeyFromEvent({ event });
  const authorNpubPublicKey = nip19.npubEncode(publicKey);

  const createdAt = event.created_at;

  return {
    id,
    authorPublicKey: publicKey,
    authorNpubPublicKey,
    content,
    plusCode,
    createdAt,
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
  const originalEventAuthor =
    getTagFirstValueFromEvent({ event, tag: "p" }) ?? "";
  const profile = profiles[originalEventAuthor];
  const authorName = profile?.name || "";
  const authorTrustrootsUsername = profile?.trustrootsUsername || "";
  const authorTripHoppingUserId = profile?.tripHoppingUserId || "";
  const createdAt =
    parseInt(
      getTagFirstValueFromEvent({
        event,
        tag: "original_created_at",
      }) ?? ""
    ) || event.created_at;
  return {
    ...baseNote,
    authorName,
    authorTrustrootsUsername,
    authorTripHoppingUserId,
    createdAt,
  };
};

const metadataEvents = new nostrify.NCache({ max: 1000 });

export async function getMetadataEvent(pubkey) {
  const events = await metadataEvents.query([{ authors: [pubkey] }]);
  if (events.length === 0) return;
  else return events[0] as MetadataEvent;
}

type SubscribeParams = {
  /** The public key of the user to fetch events for, or undefined to fetch events from all users */
  publicKey?: string;
  /** The maximum number of notes to fetch
   * @default 200
   */
  limit?: number;
  onEventReceived: (event: Kind30398Event) => void;
};
export const subscribe = async ({
  publicKey,
  onEventReceived: onEventReceived,
  limit = 200,
}: SubscribeParams) => {
  console.log("#qnvvsm nostr/subscribe", publicKey);
  const profiles: { [publicKey: string]: Profile } = {};

  const getEventsForSpecificAuthor = typeof publicKey !== "undefined";

  const oneMonthInSeconds = 30 * 24 * 60 * 60;
  const oneMonthAgo = Math.round(Date.now() / 1e3) - oneMonthInSeconds;
  const since = Math.max(EARLIEST_FILTER_SINCE, oneMonthAgo);
  const eventsBaseFilter: Filter = {
    kinds: [MAP_NOTE_REPOST_KIND],
    "#L": ["open-location-code"],
    since,
    authors: TRUSTED_VALIDATION_PUBKEYS,
  };

  const eventsFilter: Filter = getEventsForSpecificAuthor
    ? { ...eventsBaseFilter, "#p": [publicKey] }
    : eventsBaseFilter;
  const eventsFilterWithLimit = { ...eventsFilter, limit };

  const noteEventsQueue: Kind30398Event[] = [];

  const onNoteEvent = (event: Kind30398Event) => {
    // if (isDev()) console.log("#gITVd2 gotNoteEvent", event);

    if (
      !doesStringPassSanitisation(event.content) ||
      event.content.length > CONTENT_MAXIMUM_LENGTH ||
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

    noteEventsQueue.push(event);
    return;
  };

  await _query({
    filters: [eventsFilterWithLimit],
    onEvent: onNoteEvent as (event: NostrEvent) => void,
  });

  const authorsWithDuplicates = noteEventsQueue.map((event) =>
    getTagFirstValueFromEvent({ event, tag: "p" })
  );
  const authors = uniq(
    authorsWithDuplicates.filter((x) => typeof x == "string")
  );
  const profileFilter: Filter = {
    kinds: [Kind.Metadata],
    authors,
  };

  noteEventsQueue.forEach((event) => onEventReceived(event));
  backgroundProfileFetching(profileFilter);
  backgroundNoteEventsFetching(onEventReceived);
};

async function backgroundNoteEventsFetching(onEventReceived) {
  const relayPool = await _initRelays();
  const filter = {
    kinds: [MAP_NOTE_REPOST_KIND],
    "#L": ["open-location-code"],
    since: Math.floor(Date.now() / 1000),
    authors: TRUSTED_VALIDATION_PUBKEYS,
  };
  for await (const msg of relayPool.req([filter])) {
    if (msg[0] === "EVENT") onEventReceived(msg[2] as Kind30398Event);
  }
}

async function backgroundProfileFetching(profileFilter) {
  const onProfileEvent = (event: MetadataEvent) => {
    // if (isDev()) console.log("#zD1Iau got profile event", event);

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

    metadataEvents.add(event);

    // profiles[publicKey] = profile;
  };
  const relayPool = await _initRelays();
  for await (const msg of relayPool.req([profileFilter])) {
    if (msg[0] === "EVENT") onProfileEvent(msg[2] as MetadataEvent);
  }
}
