import * as L from "leaflet";
import { getRelays, setRelays } from "./nostr";
import {
  createPrivateKey,
  getNpubPublicKey,
  getNsecPrivateKey,
  getPublicKey,
  hasPrivateKey,
  setPrivateKey,
  unsetPrivateKey,
} from "./nostr/keys";
import { setProfile, subscribeAndGetProfile } from "./nostr/profiles";
import { getTrustrootsUsernameFromLocation } from "./router";
import { startWelcomeSequence } from "./welcome";
import { startUserOnboarding } from "./onboarding";

export const startup = async () => {
  const isLoggedIn = await hasPrivateKey();

  const loggedIn = L.DomUtil.get("loggedIn")!;
  const loggedOut = L.DomUtil.get("loggedOut")!;

  if (isLoggedIn) {
    L.DomUtil.addClass(loggedIn, "show");
    L.DomUtil.addClass(loggedOut, "hide");

    const signoutButton = document.getElementById("signout")!;
    signoutButton.onclick = async () => {
      await unsetPrivateKey();
      globalThis.location.reload();
    };

    const publicKey = await getPublicKey();
    const npubPublicKey = await getNpubPublicKey();
    const nsecPrivateKey = await getNsecPrivateKey();

    const publicKeyCode = globalThis.document.getElementById("npubPublicKey")!;
    publicKeyCode.innerText = npubPublicKey;
    const nsecPrivateKeyCode =
      globalThis.document.getElementById("nsecPrivateKey")!;
    nsecPrivateKeyCode.innerText = nsecPrivateKey;
  } else {
    L.DomUtil.addClass(loggedIn, "hide");
    L.DomUtil.addClass(loggedOut, "show");

    const signupButton = document.getElementById("signup")!;
    signupButton.onclick = () => {
      startUserOnboarding();
    };
  }

  const relaysInput = document.getElementById("relays") as HTMLInputElement;
  const relays = await getRelays();
  const relaysJson = JSON.stringify(relays);
  relaysInput.value = relaysJson;

  const relaySubmitButton = document.getElementById("relays_submit")!;
  relaySubmitButton.onclick = async (event) => {
    event.preventDefault();
    relaySubmitButton.setAttribute("disabled", "disabled");

    const relaysJson = relaysInput.value;
    try {
      const relays = JSON.parse(relaysJson) as string[];
      if (!Array.isArray(relays) || relays.length === 0) {
        relaySubmitButton.removeAttribute("disabled");
        globalThis.alert("Invalid relays submitted. Please try again.");
        return;
      }
      await setRelays({ relays });
      globalThis.alert("Relays saved.");
      globalThis.document.location.reload();
    } catch (error) {
      relaySubmitButton.removeAttribute("disabled");
      globalThis.alert(`#vRuf1N Error saving relays\n${error.toString()}`);
    }
  };

  startWelcomeSequence();
};
startup();
