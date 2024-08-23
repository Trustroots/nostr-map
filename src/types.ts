import * as nostrify from "@nostrify/nostrify";
import * as kind30398event from "@shuesken/nostroots-kind30398event";

export type MaybeLocalStorage = Partial<WindowLocalStorage>;

export type NostrEvent = kind30398event.Event;

export type UnsignedEvent = Omit<
  NostrEvent,
  "created_at" | "pubkey" | "id" | "sig"
>;

export type Kind30398Event = NostrEvent & {
  kind: 30398;
};

export type MetadataEvent = NostrEvent & {
  kind: 0;
};

export type Note = {
  id: string;
  plusCode: string;
  content: string;
  authorName: string;
  authorTrustrootsUsername: string;
  authorTripHoppingUserId: string;
  authorPublicKey: string;
  authorNpubPublicKey: string;
  createdAt: number;
};

export type Profile = {
  publicKey: string;
  npubPublicKey: string;
  name: string;
  about: string;
  trustrootsUsername: string;
  tripHoppingUserId: string;
  picture: string;
};
