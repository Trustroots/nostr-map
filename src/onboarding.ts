import { generatePrivateKey, nip19 } from "nostr-tools";
import { setProfile } from "./nostr";
import { setNsecPrivateKey, setPrivateKey } from "./nostr/keys";
import { getTrustrootsUsernameFromLocation } from "./router";
import { alert, confirmYesNo, prompt } from "./utils";

export const startUserOnboarding = async () => {
  const username = getTrustrootsUsernameFromLocation();
  if (username.length < 3) {
    alert(`Sorry, you need to click to this page from trustroots.org.`);
    return;
  }

  if (await confirmYesNo("Have you used trustroots notes before?")) {
    const key = await prompt({
      text: `Great. What's your private key?`,
      inputLabel: "Your private key (starts nsec)",
    });
    if (typeof key === "string" && key.length > 0 && key.startsWith("nsec")) {
      await setNsecPrivateKey({ nsecPrivateKey: key });
      alert(`Saved. Please right click again to add a note.`);
      globalThis.location.reload();
      return;
    } else {
      await alert(`Private key failed.`);
      return;
    }
  }

  if (
    !(await confirmYesNo(
      `Notes shared here are public and accessible to other services, sites and maps. I agree?`
    ))
  ) {
    await alert(
      `This will become more user friendly in the future. Feel free to come back anytime. Now we'll take you back to the main trustroots site.`
    );
    globalThis.location.href = "https://www.trustroots.org/search";
    return;
  }

  if (
    !(await confirmYesNo(
      `Notes cannot me edited or deleted. Are you ok with this?`
    ))
  ) {
    await alert(
      `This will become more user friendly in the future. Feel free to come back anytime. Now we'll take you back to the main trustroots site.`
    );
    return;
  }

  const newKey = await generatePrivateKey();
  const newKeyNsec = nip19.nsecEncode(newKey);
  await prompt({
    text: `This is your NOSTR private key. It is important that you save it somewhere safe. THIS KEY IS PRIVATE: DO NOT SHARE IT WITH ANYONE ELSE. `,
    inputValue: newKeyNsec,
  });
  const confirmedKey = await prompt({
    text: `You saved it, right. Please re-enter your NOSTR private key.`,
  });

  if (newKeyNsec !== confirmedKey) {
    await alert(
      `The private key that you entered is not the same one as the one issued to you. Right click (or long press) to start the process again.`
    );
    return;
  }

  await setPrivateKey({ privateKey: newKey });

  await setProfile({ name: "", about: "", trustrootsUsername: username });

  await alert(
    `Nice job. You're ready to create points now. Right click again to get started.`
  );

  globalThis.window.location.reload();
};
