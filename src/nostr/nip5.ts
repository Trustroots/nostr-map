import { TRUSTROOTS_NIP5_URL } from "../constants";
import { getTrustrootsUsernameFromLocation } from "../router";
import { alert } from "../utils";
import { getPublicKey } from "./keys";

export const validateNip5 = async () => {
  try {
    const username = getTrustrootsUsernameFromLocation();
    if (username.length < 3) {
      alert(
        `Sorry, you need to click to this page from trustroots.org. Without doing that, this site won't work properly. Please go to www.trustroots.org and click the Notes link to come back here. #wBjsEe`,
        `You need to click from trustroots`
      );
      return;
    }

    const result = await fetch(`${TRUSTROOTS_NIP5_URL}?name=${username}`);
    const nip5 = (await result.json()) as {
      names: { [username: string]: string };
    };
    const nip5PublicKey = nip5.names?.[username];
    const localPublicKey = await getPublicKey();
    if (nip5PublicKey !== localPublicKey) {
      alert(
        `Your key doesn't match trustroots. Posting to the map will not work. Please sign out and sign in again with the nsec key that matches your trustroots npub key. #H9bEe2`,
        "Fatal error"
      );
    }
  } catch (error) {
    alert(error, `Unexpected error`);
  }
};
