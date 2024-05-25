import Swal from "sweetalert2";
import { hasPrivateKey } from "./nostr/keys";
import { confirmYesNo } from "./utils";

export const startWelcomeSequence = async () => {
  const isLoggedIn = await hasPrivateKey();
  if (isLoggedIn) {
    return;
  }

  if (
    !(await confirmYesNo(
      `Notes is an experimental feature using an open developed protocol called NOSTR. Continue?`
    ))
  ) {
    await Swal.fire({
      text: `This will become more user friendly in the future. Feel free to come back anytime. Now we'll take you back to the main trustroots site.`,
    });
    globalThis.location.href = `http://www.trustroots.org/search`;
    return;
  }

  Swal.fire({
    text: `Great. Browse map to see other people's notes and right click (or long press on mobile) to add your own note. `,
  });
};
