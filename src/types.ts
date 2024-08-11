import * as nostrify from "@nostrify/nostrify";

export type MaybeLocalStorage = Partial<WindowLocalStorage>;

export type NostrEvent = nostrify.NostrEvent;

export type UnsignedEvent = Omit<
  NostrEvent,
  "created_at" | "pubkey" | "id" | "sig"
>;

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
