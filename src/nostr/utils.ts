import DOMPurify from "dompurify";
import {
  getEventHash,
  getPublicKey as getPublicKeyFromPrivateKey,
  Kind,
  nip19,
  nip26,
  signEvent,
} from "nostr-tools";
import Swal from "sweetalert2";
import { MAP_NOTE_REPOST_KIND } from "../constants";
import { getTrustrootsUsernameFromLocation } from "../router";
import { NostrEvent, Profile, UnsignedEvent } from "../types";
import { setProfile } from "./profiles";

export const dateToUnix = (_date?: Date) => {
  const date = _date || new Date();

  return Math.floor(date.getTime() / 1000);
};

export const getPublicKeyFromEvent = ({ event }: { event: NostrEvent }) => {
  if (event.kind === MAP_NOTE_REPOST_KIND) {
    const pTagValue = getTagFirstValueFromEvent({ event, tag: "p" });
    if (typeof pTagValue === "undefined") {
      throw new Error("#c5LIMS Event 30398 missing p tag");
    }
    return pTagValue;
  }

  const maybeDelegator = nip26.getDelegator(event);
  return maybeDelegator || event.pubkey;
};

export const getProfileFromEvent = ({
  event,
}: {
  event: NostrEvent;
}): Profile => {
  if (event?.kind !== Kind.Metadata) {
    throw new Error("#pC5T6P Trying to get profile from non metadata event");
  }

  const profileJson = event.content;
  const publicKey = getPublicKeyFromEvent({ event });
  const npubPublicKey = nip19.npubEncode(publicKey);
  try {
    const profile = JSON.parse(profileJson) as Omit<
      Profile,
      "publicKey" | "npubPublicKey"
    >;

    const emptyProfile = {
      name: "",
      about: "",
      trustrootsUsername: "",
      tripHoppingUserId: "",
      picture: "",
    };

    return { ...emptyProfile, ...profile, publicKey, npubPublicKey };
  } catch (e) {
    const message = "#j2o1vH Failed to get profile from event";
    console.error(message, e);
    throw new Error(message);
  }
};

export const filterForTag = (key: string) => (tags: string[]) =>
  tags[0] === key;

type GetTagFirstValueFromEventParams = {
  /** The event to extract the tag value from */
  event: NostrEvent;
  /** The name (key) of the tag to get the value of */
  tag: string;
};
/**
 * @returns - The string value of the tag, or undefined if the tag does not exist
 */
export const getTagFirstValueFromEvent = ({
  event,
  tag,
}: GetTagFirstValueFromEventParams) => {
  const tagArray = event.tags.find(filterForTag(tag));
  if (typeof tagArray === "undefined") {
    return;
  }
  // The value is the second element in the array
  return tagArray[1];
};

type GetTagValuesFromEventParams = {
  /** The event to extract the tag value from */
  event: NostrEvent;
  /** The name (key) of the tag to get the values of */
  tag: string;
};
/**
 * @returns - An array of the string values for this tag
 */
export const getTagValuesFromEvent = ({
  event,
  tag,
}: GetTagValuesFromEventParams): string[] => {
  const tagArrays = event.tags.filter(filterForTag(tag));
  const tagValues = tagArrays.map((tag) => tag[1]);
  return tagValues;
};

export const signEventWithPrivateKey = ({
  unsignedEvent,
  privateKey,
}: {
  unsignedEvent: UnsignedEvent;
  privateKey: string;
}) => {
  const pubkey = getPublicKeyFromPrivateKey(privateKey);
  const base = {
    ...unsignedEvent,
    created_at: dateToUnix(),
    pubkey,
  };
  const id = getEventHash(base);
  const toSign = { ...base, id };
  const sig = signEvent(toSign, privateKey);
  const signed = { ...toSign, sig };
  return signed;
};

export const uniq = <T>(input: T[]): T[] => {
  return input.filter((val, index, input) => index === input.indexOf(val));
};

export const sanitise = (input: string): string => {
  const sanitised = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  return sanitised;
};

export const doesStringPassSanitisation = (
  input: string | undefined
): boolean => {
  if (typeof input === "undefined") {
    return true;
  }
  const sanitised = sanitise(input);
  return sanitised === input;
};

export const isDev = (): boolean => {
  if (window.location.host.includes("localhost")) {
    return true;
  }
  return false;
};

export const isValidPlusCode = (input: string | undefined): boolean => {
  if (typeof input === "undefined") {
    return false;
  }

  const result = input.match(
    /^[23456789C][23456789CFGHJMPQRV][23456789CFGHJMPQRVWX]{4}[023456789CFGHJMPQRVWX]{2}\+[23456789CFGHJMPQRVWX]{0,3}$/
  );
  if (result !== null) {
    return true;
  }
  return false;
};

export const resendKindZero = async () => {
  const trustrootsUsername = getTrustrootsUsernameFromLocation();
  if (trustrootsUsername.length < 3) {
    Swal.fire({ text: "Please click the link from www.trustroots.org again." });
    return;
  }
  await setProfile({ name: "", about: "", trustrootsUsername });
  return "#6hMURG success";
};
(globalThis.window as any).resendKindZero = resendKindZero;
