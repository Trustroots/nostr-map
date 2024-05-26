import * as L from "leaflet";
import { DEFAULT_RELAYS } from "./constants";
import { hackSidePanelClosed, hackSidePanelOpen } from "./map";
import { getRelays, setRelays } from "./nostr";
import {
  getNpubPublicKey,
  getNsecPrivateKey,
  getPublicKey,
  hasPrivateKey,
  unsetPrivateKey,
} from "./nostr/keys";
import { startUserOnboarding } from "./onboarding";
import { startWelcomeSequence } from "./welcome";

export const startup = async () => {
  const isLoggedIn = await hasPrivateKey();

  const helpLink = document.getElementById("help")!;
  helpLink.onclick = (event) => {
    event.preventDefault();
    hackSidePanelOpen();
  };

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
      hackSidePanelClosed();
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
      const relaysFromJson = JSON.parse(relaysJson) as string[];
      if (!Array.isArray(relaysFromJson)) {
        relaySubmitButton.removeAttribute("disabled");
        globalThis.alert("Invalid relays submitted. Please try again.");
        return;
      }
      const relays =
        relaysFromJson.length === 0 ? DEFAULT_RELAYS : relaysFromJson;
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
