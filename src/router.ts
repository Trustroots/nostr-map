import { nip19 } from "nostr-tools";

export const getTrustrootsUsernameFromLocation = ({
  location = globalThis.document.location,
}: {
  location?: Location;
} = {}): string => {
  const { hash } = location;
  const params = hash.split("="); // /#user={user}
  if (typeof params[1] === "string") {
    const username = params[1];
    const sanitisedUsername = encodeURIComponent(username);
    return sanitisedUsername;
  }
  return "";
};
