import L, { CircleMarkerOptions } from "leaflet";
import "leaflet.sidepanel";

import { decode, encode } from "pluscodes";
import {
  BADGE_CONTAINER_ID,
  HITCHMAPS_AUTHOR_PUBLIC_KEY,
  CONTENT_MAXIMUM_LENGTH,
  CONTENT_MINIMUM_LENGTH,
  PANEL_CONTAINER_ID,
  PLUS_CODE_TAG_KEY,
} from "./constants";
import { hasPrivateKey } from "./nostr/keys";
import { createNote } from "./nostr/notes";
import { _initRelays } from "./nostr/relays";
import { getMetadataEvent, subscribe } from "./nostr/subscribe";
import { startUserOnboarding } from "./onboarding";
import { Note, NostrEvent, Kind30398Event, MetadataEvent } from "./types";
import {
  getProfileFromEvent,
  getPublicKeyFromEvent,
  getTagFirstValueFromEvent,
} from "./nostr/utils";

const map = L.map("map", {
  zoomControl: false,
}).setView([0, 0], 2);

L.control
  .zoom({
    position: "bottomright",
  })
  .addTo(map);

// Add a custom button to zoom to user's location
const LocationButton = L.Control.extend({
  options: {
    position: "bottomright",
  },

  onAdd: function (map) {
    const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    const button = L.DomUtil.create(
      "button",
      "leaflet-control-custom",
      container
    );
    button.innerHTML = "📍"; // Location pin emoji
    button.style.backgroundColor = "white";
    button.style.width = "30px";
    button.style.height = "30px";
    button.style.color = "green"; // Make the pin green
    button.title = "Zoom to your location";

    // Move the button slightly to the left
    container.style.marginRight = "10px";

    button.onclick = function () {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            map.setView([lat, lon], 15); // Zoom in more than city level
          },
          function (error) {
            console.error("Error getting location:", error);
            alert(
              "Unable to retrieve your location. Please check your browser settings."
            );
          }
        );
      } else {
        alert("Geolocation is not supported by your browser.");
      }
    };

    return container;
  },
});

new LocationButton().addTo(map);

// this lets us add multiple notes to a single area
const plusCodesWithPopupsAndNotes: {
  [key: string]: { popup: L.Popup; notes: [Note] };
} = {};

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const circleMarker: CircleMarkerOptions = {
  color: "purple",
  fillColor: "#A020F0",
  fillOpacity: 0.5,
  radius: 8,
};

// NOTE: The leaflet sidepanel plugin doesn't have types in `@types/leaflet` and
// so we need to cast to any here.

(L.control as any).sidepanel(PANEL_CONTAINER_ID, { hasTabs: true }).addTo(map);

// The leaflet sidepanel plugin doesn't export an API, so we've written our own
export const hackSidePanelOpen = () => {
  const panel = L.DomUtil.get(PANEL_CONTAINER_ID);
  L.DomUtil.removeClass(panel!, "closed");
  L.DomUtil.addClass(panel!, "opened");
};

// The leaflet sidepanel plugin doesn't export an API, so we've written our own
export const hackSidePanelClosed = () => {
  const panel = L.DomUtil.get(PANEL_CONTAINER_ID);
  L.DomUtil.removeClass(panel!, "opened");
  L.DomUtil.addClass(panel!, "closed");
};

map.on("contextmenu", async (event) => {
  const isLoggedIn = await hasPrivateKey();

  if (!isLoggedIn) {
    startUserOnboarding();
    return;
  }

  // Testing my edit capabilities with just this comment
  const coords = { latitude: event.latlng.lat, longitude: event.latlng.lng };
  const plusCode = encode(coords, 10);

  if (plusCode === null) {
    throw new Error("#gssRRU Got null for plusCode");
  }

  // Create a marker instead of a polygon
  const marker = L.circleMarker(event.latlng, circleMarker);

  marker.addTo(map);

  const createNoteCallback = async (content, expirationDate) => {
    createNote({ content, plusCode, expirationDate });
  };

  const popupContent = createPopupHtml(createNoteCallback);

  L.popup()
    .setLatLng(event.latlng)
    .setContent(popupContent)
    .openOn(map)
    .on("remove", (e) => marker.remove());
});

function generatePolygonFromPlusCode(plusCode: string) {
  const decoded = decode(plusCode);
  const { resolution: res, longitude: cLong, latitude: cLat } = decoded!;
  const latlngs = [
    L.latLng(cLat + res / 2, cLong + res / 2),
    L.latLng(cLat - res / 2, cLong + res / 2),
    L.latLng(cLat - res / 2, cLong - res / 2),
    L.latLng(cLat + res / 2, cLong - res / 2),
  ];
  const poly = L.polygon(latlngs);
  return poly;
}

// TODO - Can we restart our code instead of reloading the whole window?
globalThis.addEventListener("popstate", (event) => {
  globalThis.document.location.reload();
});

function generateDatetimeFromEvent(event: Kind30398Event): string {
  const createdAt =
    parseInt(
      getTagFirstValueFromEvent({
        event,
        tag: "original_created_at",
      }) ?? "0"
    ) || 0;
  const date = new Date(createdAt * 1000);

  return date.toLocaleString();
}

function generateLinkFromMetadataEvent(event: MetadataEvent): string {
  const profile = getProfileFromEvent({ event });

  const { name, trustrootsUsername, tripHoppingUserId } = profile;
  if (trustrootsUsername.length > 2) {
    if (name.length > 1) {
      return ` <a href="https://www.trustroots.org/profile/${trustrootsUsername}" target="_blank">${name}</a>`;
    }
    return ` <a href="https://www.trustroots.org/profile/${trustrootsUsername}" target="_blank">${trustrootsUsername}</a>`;
  }

  if (tripHoppingUserId.length > 3) {
    if (name.length > 1) {
      return ` <a href="https://www.triphopping.com/profile/${tripHoppingUserId}" target="_blank">${name}</a>`;
    }
    return ` <a href="https://www.triphopping.com/profile/${tripHoppingUserId}" target="_blank">${tripHoppingUserId.slice(
      0,
      5
    )}</a>`;
  }
  return "";
}

function generateMapContentFromEvent(
  event: Kind30398Event,
  metadataEvent?: MetadataEvent
) {
  const link = metadataEvent
    ? generateLinkFromMetadataEvent(metadataEvent)
    : "";
  const datetime = generateDatetimeFromEvent(event);
  const noteContent = `${event.content}${link} ${datetime}`;
  return noteContent;
}

// todo: needs to be DRYed up
function generateChatContentFromNotes(
  event: Kind30398Event,
  metadataEvent: MetadataEvent
) {
  const link = generateLinkFromMetadataEvent(metadataEvent);
  const datetime = generateDatetimeFromEvent(event);
  const noteContent = `${datetime}, ${link}: ${event.content}`;
  return noteContent;
}

function addNoteToMap(event: Kind30398Event) {
  const plusCode =
    getTagFirstValueFromEvent({
      event,
      tag: PLUS_CODE_TAG_KEY,
    }) ?? "";

  const decodedCoords = decode(plusCode);
  const { resolution: res, longitude: cLong, latitude: cLat } = decodedCoords!;

  let color;
  let fillColor;
  const hitchWikiYellow = "#F3DA71";
  const hitchWikiYellowLight = "#FFFBEE";
  const trGreen = "#12B591";

  if (event.pubkey === HITCHMAPS_AUTHOR_PUBLIC_KEY) {
    color = hitchWikiYellow;
    fillColor = hitchWikiYellowLight;
  } else {
    color = trGreen;
  }

  // Create marker with decoded coordinates
  const marker = L.circleMarker([cLat, cLong], {
    ...circleMarker,
    color,
    fillColor,
  });
  marker.addTo(map);

  marker.on(
    "click",
    async (markerClickEvent) =>
      await populateAndOpenPopup(markerClickEvent, event)
  );
}

async function populateAndOpenPopup(
  markerClickEvent: L.LeafletEvent,
  kind30398Event: Kind30398Event
) {
  const marker = markerClickEvent.target as L.Marker;

  const authorPubkey = getPublicKeyFromEvent({ event: kind30398Event });
  const metadataEvent = await getMetadataEvent(authorPubkey);
  if (!metadataEvent)
    console.warn(
      `#rtsNdn Could not get metadata event for event`,
      kind30398Event
    );
  const contentMap = generateMapContentFromEvent(kind30398Event, metadataEvent);
  const popup = L.popup().setContent(contentMap);
  marker.bindPopup(popup);
  marker.openPopup();
}

function createPopupHtml(createNoteCallback) {
  const popupContainer = document.createElement("div");
  popupContainer.className = "popup-container";
  const contentTextArea = document.createElement("textarea");
  contentTextArea.id = "content";
  contentTextArea.required = true;
  contentTextArea.placeholder = "What do you want to say about this area?";
  contentTextArea.cols = 35;
  contentTextArea.rows = 8;
  contentTextArea.style.resize = "none";
  contentTextArea.maxLength = CONTENT_MAXIMUM_LENGTH;
  contentTextArea.minLength = CONTENT_MINIMUM_LENGTH;

  const expirationSelect = document.createElement("select");

  const expirationOptions = {
    "5 minutes": 5 * 60,
    "1 hour": 60 * 60,
    "1 day": 24 * 60 * 60,
    "1 week": 7 * 24 * 60 * 60,
    "1 month": 30 * 24 * 60 * 60,
    "no expiry": null,
  };
  Object.entries(expirationOptions).forEach(([humanReadable, value]) => {
    const expirationOption = document.createElement("option");
    expirationOption.value = value?.toString() ?? "";
    expirationOption.innerText = humanReadable;
    expirationSelect.appendChild(expirationOption);
  });
  const submitButton = document.createElement("button");
  submitButton.innerText = "Add Note!";
  submitButton.style.float = "right";
  submitButton.onclick = () => {
    const content = contentTextArea.value;
    const expirationTime = parseInt(expirationSelect.value) || null;
    const expirationDate = expirationTime
      ? Math.floor(Date.now() / 1000 + expirationTime)
      : null;
    createNoteCallback(content, expirationDate);
    map.closePopup();
  };
  popupContainer.appendChild(contentTextArea);
  popupContainer.appendChild(expirationSelect);
  popupContainer.appendChild(submitButton);
  return popupContainer;
}

const mapStartup = async () => {
  const badge = L.DomUtil.get(BADGE_CONTAINER_ID) as HTMLElement;
  L.DomUtil.addClass(badge, "hide");
  L.DomUtil.removeClass(badge, "show");
  await _initRelays();
  subscribe({ onEventReceived: addNoteToMap });
};
mapStartup();
