import { nip19 } from "nostr-tools";

export const getPublicKeyFromUrl = ({
  location = globalThis.document.location,
}: {
  location?: Location;
} = {}): {
  publicKey?: string;
  view?: {
    zoom: number;
    lat: number;
    lng: number;
  };
} => {
  const { hash } = location;
  if (!hash) return {};
  const params = hash.split("/"); // #/{pubkey}/{zoom}/{lat}/{lng}
  console.log(hash, params);
  let publicKey;
  if (params[1].startsWith("npub")) {
    const { type, data } = nip19.decode(params[1]);
    if (type === "npub") publicKey = data as string;
  }

  let view;
  const zoomParam = Number.parseInt(params[2]);
  const latParam = Number.parseFloat(params[3]);
  const lngParam = Number.parseFloat(params[4]);
  if (
    !Number.isNaN(zoomParam) &&
    zoomParam > 0 &&
    zoomParam < 18 &&
    !Number.isNaN(lngParam) &&
    !Number.isNaN(lngParam)
  )
    view = {
      zoom: zoomParam,
      lat: latParam,
      lng: lngParam,
    };

  return {
    publicKey,
    view,
  };
};

export const getUrlFromNpubPublicKey = ({
  npubPublicKey,
  location = globalThis.document.location,
  view,
}: {
  npubPublicKey: string;
  location?: Location;
  view?: {
    zoom: number;
    lat: number;
    lng: number;
  };
}): string => {
  const { origin, pathname } = location;
  let yourUrl = origin + pathname + "#/" + npubPublicKey;
  if (view) yourUrl += `/${view.zoom}/${view.lat}/${view.lng}`;
  return yourUrl;
};

export const getUrlFromPublicKeyAndView = ({
  publicKey,
  view,
}: {
  publicKey: string;
  view?: {
    zoom: number;
    lat: number;
    lng: number;
  };
}): string => {
  const npubPublicKey = nip19.npubEncode(publicKey);
  const yourUrl = getUrlFromNpubPublicKey({ npubPublicKey, view });
  return yourUrl;
};
