import { hasPrivateKey } from "./nostr/keys";

export const startWelcomeSequence = async () => {
  const isLoggedIn = await hasPrivateKey();
  if (isLoggedIn) {
    return;
  }

  if (
    !globalThis.confirm(
      "Welcome. This is experimental. Are you ready to get wild?"
    )
  ) {
    globalThis.alert(`Then we'll take you back to the safety of trustroots`);
    globalThis.location.href = `http://www.trustroots.org/search`;
    return;
  }

  globalThis.alert(
    `Right click if you want to add something to the map. Have fun.`
  );
};
