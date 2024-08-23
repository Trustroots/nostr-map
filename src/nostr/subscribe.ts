import { newQueue } from "@henrygd/queue";
import * as nostrify from "@nostrify/nostrify";
import * as kind30398event from "@shuesken/nostroots-kind30398event";
import { Filter, Kind } from "nostr-tools";
import {
  CONTENT_MAXIMUM_LENGTH,
  MAP_NOTE_REPOST_KIND,
  PLUS_CODE_TAG_KEY,
  TRUSTED_VALIDATION_PUBKEYS,
} from "../constants";
import { Kind30398Event, MetadataEvent } from "../types";
import { _initRelays, getFirstEventFromAnyRelay } from "./relays";
import {
  doesStringPassSanitisation,
  getProfileFromEvent,
  getPublicKeyFromEvent,
  getTagFirstValueFromEvent,
  isValidPlusCode,
} from "./utils";

const fetchProfileQueue = newQueue(2);

const metadataEvents = new nostrify.NCache({ max: 1000 });
const kind30398Events = new nostrify.NCache({ max: 1000 });

export async function getMetadataEvent(pubkey) {
  const events = await metadataEvents.query([{ authors: [pubkey] }]);
  if (events.length === 0) {
    console.log(`#eQyWh1 Failed to get metadata event for pubKey ${pubkey}`);
    return;
  } else {
    return events[0] as MetadataEvent;
  }
}

export async function getKind30398Events() {
  return kind30398Events;
}

type SubscribeParams = {
  /** The maximum number of notes to fetch
   * @default 200
   */
  limit?: number;
  onEventReceived: (event: Kind30398Event) => void;
};
export const subscribe = async ({
  onEventReceived: onEventReceived,
  limit = 200,
}: SubscribeParams) => {
  console.log("#qnvvsm nostr/subscribe");

  const onNoteEvent = (event: any) => {
    // if (isDev()) console.log("#gITVd2 gotNoteEvent", event);

    try {
      const parsedEvent = kind30398event.kind30398EventSchema.parse(event);
      kind30398Events.add(parsedEvent);
      onEventReceived(parsedEvent);
      const pubKey = getPublicKeyFromEvent({ event });
      fetchProfileQueue.add(fetchProfileFactory(pubKey));
      return;
    } catch (e) {
      console.warn(`Event could not be parsed: ${JSON.stringify(event)}`);
      return;
    }
  };

  /*
  console.log("#6MgNzq Starting subscription", eventsFilter);
  // NOTE: This just handles events until the EOSE event. It does not maintain
  // an active subscription. So we do that below.

  const relayPool = await _initRelays();

  // better handling here, this will throw an error if a relay is unresponsive
  const events = (await promiseWithTimeout(
    relayPool.query([eventsFilter]),
    5000
  )) as Kind30398Event[];

  console.log("#4aIfX6 Got stored events", events);

  events.forEach(onNoteEvent);

  logStateToConsole();
  */

  backgroundNoteEventsFetching(onNoteEvent);
};

function fetchProfileFactory(pubKey) {
  return async function () {
    console.log(`#2HYOLy Fetching profile for pubKey ${pubKey}`);
    const profileFilter: Filter = {
      kinds: [Kind.Metadata],
      authors: [pubKey],
    };

    const cachedEvents = await metadataEvents.query([profileFilter]);

    if (cachedEvents.length > 0) {
      return;
    }

    const event = await getFirstEventFromAnyRelay(profileFilter);
    if (typeof event !== "undefined") {
      onProfileEvent(event as MetadataEvent);
    }
  };
}

async function backgroundNoteEventsFetching(onEventReceived) {
  const seenEventIdentifiers = new Set<string>();

  const relayPool = await _initRelays();
  const filter = {
    kinds: [MAP_NOTE_REPOST_KIND],
    "#L": ["open-location-code"],
    // since: Math.floor(Date.now() / 1000),
    authors: TRUSTED_VALIDATION_PUBKEYS,
  };
  for await (const message of relayPool.req([filter])) {
    const [messageType, , event] = message;
    if (messageType === "EVENT") {
      const eventDTag = getTagFirstValueFromEvent({ event, tag: "d" });
      const eventIdentifier = `${event.pubkey}.${eventDTag}`;
      if (seenEventIdentifiers.has(eventIdentifier)) {
        continue;
      }
      seenEventIdentifiers.add(eventIdentifier);
      onEventReceived(event as Kind30398Event);
    }
  }
}

const onProfileEvent = (event: MetadataEvent) => {
  // console.log("#zD1Iau got profile event", event);

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
};
