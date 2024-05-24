import * as L from "leaflet";
import { getRelays, setRelays } from "./nostr";
import {
  createPrivateKey,
  getNpubPublicKey,
  getNsecPrivateKey,
  getPublicKey,
  hasPrivateKey,
  setPrivateKey,
} from "./nostr/keys";
import { setProfile, subscribeAndGetProfile } from "./nostr/profiles";
import { getTrustrootsUsernameFromLocation } from "./router";
import { startWelcomeSequence } from "./welcome";

export const startup = async () => {
  const isLoggedIn = await hasPrivateKey();

  const loggedIn = L.DomUtil.get("loggedIn")!;
  const loggedOut = L.DomUtil.get("loggedOut")!;

  if (isLoggedIn) {
    L.DomUtil.addClass(loggedIn, "show");
    L.DomUtil.addClass(loggedOut, "hide");

    const publicKey = await getPublicKey();
    const npubPublicKey = await getNpubPublicKey();
    const nsecPrivateKey = await getNsecPrivateKey();

    const publicKeyCode = globalThis.document.getElementById("npubPublicKey")!;
    publicKeyCode.innerText = npubPublicKey;
    const nsecPrivateKeyCode =
      globalThis.document.getElementById("nsecPrivateKey")!;
    nsecPrivateKeyCode.innerText = nsecPrivateKey;

    const profileNameInput = document.getElementById(
      "profile_name"
    ) as HTMLInputElement;
    const profileAboutInput = document.getElementById(
      "profile_about"
    ) as HTMLInputElement;
    const profile = await subscribeAndGetProfile({ publicKey });
    profileNameInput.value = profile.name;
    profileAboutInput.value = profile.about;

    const profileSubmitButton = document.getElementById("profile_submit")!;
    profileSubmitButton.onclick = async (event) => {
      event.preventDefault();
      profileSubmitButton.setAttribute("disabled", "disabled");

      const name = profileNameInput.value;
      const about = profileAboutInput.value;
      const trustrootsUsername = getTrustrootsUsernameFromLocation();

      try {
        await setProfile({ name, about, trustrootsUsername });

        globalThis.alert("Your profile was updated.");
        globalThis.document.location.reload();
      } catch {
        globalThis.alert("There was an error. Please try again.");
        profileSubmitButton.removeAttribute("disabled");
      }
    };
  } else {
    L.DomUtil.addClass(loggedIn, "hide");
    L.DomUtil.addClass(loggedOut, "show");

    const signupSubmit = document.getElementById("signup_submit")!;
    signupSubmit.onclick = async (event) => {
      event.preventDefault();
      signupSubmit.setAttribute("disabled", "disabled");
      const name = (document.getElementById("signup_name") as HTMLInputElement)
        .value;
      const about = (
        document.getElementById("signup_about") as HTMLInputElement
      ).value;

      try {
        await createPrivateKey();
        const trustrootsUsername = getTrustrootsUsernameFromLocation();
        setProfile({ name, about, trustrootsUsername }).then(() => {
          globalThis.alert("Your account was created.");
          globalThis.document.location.reload();
        });
      } catch {
        signinSubmit.removeAttribute("disabled");
      }
    };

    const signinSubmit = document.getElementById("signin_submit")!;
    signinSubmit.onclick = async (event) => {
      event.preventDefault();
      signupSubmit.setAttribute("disabled", "disabled");
      const privateKey = (
        document.getElementById("signin_privateKey") as HTMLInputElement
      ).value;

      try {
        setPrivateKey({ privateKey });
        globalThis.alert("You were signed in successfully.");
        globalThis.document.location.reload();
      } catch {
        signinSubmit.removeAttribute("disabled");
      }
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
