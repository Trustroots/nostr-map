import { generatePrivateKey } from "nostr-tools";
import { setPrivateKey } from "./nostr/keys";

export const startUserOnboarding = async () => {
  if (globalThis.confirm("Have you used trustroots notes before?")) {
    const key = globalThis.prompt(`Great. What's your private key?`);
    if (key !== null && key.length > 0) {
      await setPrivateKey({ privateKey: key });
      globalThis.alert(`Saved. Please right click again to add a note.`);

      return;
    }
  }

  if (
    !globalThis.confirm(
      "Ready to share your data with sites like triphopping.com?"
    )
  ) {
    globalThis.alert(
      `Okay, this is not the demo for you. We'll take you back to trustroots now.`
    );
    globalThis.location.href = "https://www.trustroots.org/search";
    return;
  }

  if (
    !globalThis.confirm(
      `Happy to post content which you can't get back, edit or delete?`
    )
  ) {
    globalThis.alert(`Sorry, we're not ready for you yet.`);
    return;
  }

  if (!globalThis.confirm(`Ready to manage your own key?`)) {
    globalThis.alert(
      `Sorry, we haven't built the key management yet. Please try again later.`
    );
    return;
  }

  const newKey = await generatePrivateKey();
  globalThis.prompt(`Here's your key. Save it.`, newKey);
  const confirmedKey = globalThis.prompt(
    `You saved it right? Please paste it back here just to check.`
  );

  if (newKey !== confirmedKey) {
    globalThis.alert(`Sorry, those didn't match.`);
    return;
  }

  await setPrivateKey({ privateKey: newKey });

  globalThis.alert(
    `Nice job. You're ready to create points now. Right click again to get started.`
  );
};
