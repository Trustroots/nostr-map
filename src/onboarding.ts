import Swal from "sweetalert2";
import { generatePrivateKey } from "nostr-tools";
import { setPrivateKey } from "./nostr/keys";
import { getTrustrootsUsernameFromLocation } from "./router";
import { setProfile } from "./nostr";
import { alert, confirmYesNo, prompt } from "./utils";

export const startUserOnboarding = async () => {
  if (await confirmYesNo("Have you used trustroots notes before?")) {
    const key = await prompt({
      text: `Great. What's your private key?`,
      inputLabel: "Your private key (starts nsec)",
    });
    if (typeof key === "string" && key.length > 0 && key.startsWith("nsec")) {
      await setPrivateKey({ privateKey: key });
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
      "Ready to share your data with sites like triphopping.com?"
    ))
  ) {
    await alert(
      `Okay, this is not the demo for you. We'll take you back to trustroots now.`
    );
    globalThis.location.href = "https://www.trustroots.org/search";
    return;
  }

  if (
    !(await confirmYesNo(
      `Happy to post content which you can't get back, edit or delete?`
    ))
  ) {
    await alert(`Sorry, we're not ready for you yet.`);
    return;
  }

  if (!(await confirmYesNo(`Ready to manage your own key?`))) {
    await alert(
      `Sorry, we haven't built the key management yet. Please try again later.`
    );
    return;
  }

  const newKey = await generatePrivateKey();
  await prompt({ text: `Here's your key. Save it.`, inputValue: newKey });
  const confirmedKey = await prompt({
    text: `You saved it right? Please paste it back here just to check.`,
  });

  if (newKey !== confirmedKey) {
    await alert(`Sorry, those didn't match.`);
    return;
  }

  await setPrivateKey({ privateKey: newKey });

  const trustrootsUsername = getTrustrootsUsernameFromLocation();
  await setProfile({ name: "", about: "", trustrootsUsername });

  await alert(
    `Nice job. You're ready to create points now. Right click again to get started.`
  );

  globalThis.window.location.reload();
};
