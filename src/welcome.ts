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
      "Welcome. This is experimental. Are you ready to get wild?"
    ))
  ) {
    await Swal.fire({
      text: `Then we'll take you back to the safety of trustroots`,
    });
    globalThis.location.href = `http://www.trustroots.org/search`;
    return;
  }

  Swal.fire({
    text: `Right click if you want to add something to the map. Have fun.`,
  });
};
