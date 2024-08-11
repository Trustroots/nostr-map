import Swal from "sweetalert2";
import { TRUSTED_VALIDATION_PUBKEYS } from "./constants";
import { getProfileFromEvent } from "./nostr/utils";
import { getPrivateKey, getRelays } from "./nostr";
import { _initRelays } from "./nostr/relays";
import { getPublicKey } from "nostr-tools";
import { getMetadataEvent } from "./nostr/subscribe";

export const confirmYesNo = async (text: string) => {
  const result = await Swal.fire({
    text,
    showCancelButton: true,
    cancelButtonText: "No",
    confirmButtonText: "Yes",
  });
  if (result.isDismissed) {
    return false;
  }
  if (result.isConfirmed) {
    return true;
  }
  return false;
};

export const alert = async (text: string, title?: string) => {
  await Swal.fire({
    title,
    text,
  });
};

export const prompt = async ({
  text,
  inputLabel,
  inputValue,
}: {
  text: string;
  inputLabel?: string;
  inputValue?: string;
}) => {
  const keyResult = await Swal.fire({
    text,
    input: "text",
    inputLabel,
    inputValue,
  });
  if (typeof keyResult.value === "string") {
    return keyResult.value;
  }
};

export function promiseWithTimeout(promise: Promise<any>, timeout: number) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      reject(`Timed out after ${timeout}ms.`);
    }, timeout);
    promise.then((r) => {
      resolve(r);
    });
  });
}

export async function logStateToConsole() {
  const validationLines: string[] = [];
  for (const key of TRUSTED_VALIDATION_PUBKEYS) {
    const metadataEvent = await getMetadataEvent(key);
    if (!metadataEvent) validationLines.push(`No profile: ${key}`);
    else {
      const profile = getProfileFromEvent({ event: metadataEvent });
      const line = `${profile.name} ${
        profile.trustrootsUsername
      } ${key.substring(0, 10)}…`;
      validationLines.push(line);
    }
  }

  const relays = await getRelays();
  const relayLine = relays.join(", ");

  const privateKey = await getPrivateKey();
  const publicKey = getPublicKey(privateKey);
  const metadataEvent = await getMetadataEvent(publicKey);
  let myProfileLine = "";
  if (!metadataEvent) myProfileLine = `No profile: ${publicKey}`;
  else {
    const profile = getProfileFromEvent({ event: metadataEvent });
    const line = `${profile.name} ${
      profile.trustrootsUsername
    } ${publicKey.substring(0, 10)}…`;
    myProfileLine = line;
  }
  console.debug(`
# TRUSTED VALIDATION PUBKEYS
${validationLines}

# CURRENT RELAYS
${relayLine}

# MY PROFILE
${myProfileLine}
    
    `);
}
