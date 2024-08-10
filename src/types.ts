import { Event } from "nostr-tools";

export type MaybeLocalStorage = Partial<WindowLocalStorage>;

export type NostrEvent = Required<Event>;

export type UnsignedEvent = Omit<Event, "created_at" | "pubkey">;

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
