import L from "leaflet";
import "leaflet.sidepanel";

import { decode, encode } from "pluscodes";
import {
  BADGE_CONTAINER_ID,
  HITCHMAPS_AUTHOR_PUBLIC_KEY,
  CONTENT_MAXIMUM_LENGTH,
  CONTENT_MINIMUM_LENGTH,
  PANEL_CONTAINER_ID,
} from "./constants";
import { hasPrivateKey } from "./nostr/keys";
import { createNote } from "./nostr/notes";
import { _initRelays } from "./nostr/relays";
import { subscribe } from "./nostr/subscribe";
import { startUserOnboarding } from "./onboarding";
import { Note } from "./types";

const map = L.map("map", {
  zoomControl: false,
}).setView([0, 0], 2);

L.control
  .zoom({
    position: "bottomright",
  })
  .addTo(map);

// this lets us add multiple notes to a single area
const plusCodesWithPopupsAndNotes: {
  [key: string]: { popup: L.Popup; notes: [Note] };
} = {};

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// NOTE: None of these properties are recognised by the `@types/leaflet` types,
// so we cast to `L.MarkerOptions` here.
const circleMarker = {
  color: "purple",
  fillColor: "#A020F0",
  fillOpacity: 0.5,
  radius: 8,
} as L.MarkerOptions;

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

function generateDatetimeFromNote(note: Note): string {
  const { createdAt } = note;
  const date = new Date(createdAt * 1000);

  return date.toLocaleString();

  const month = ("0" + (date.getMonth() + 1)).slice(-2); // Months are zero-based, so add 1
  const day = ("0" + date.getDate()).slice(-2);

  // Extract the time components
  const hours = ("0" + date.getHours()).slice(-2);
  const minutes = ("0" + date.getMinutes()).slice(-2);

  // Format the date and time strings
  const datetime = `${hours}:${minutes} ${day}-${month}`;

  return datetime;
}

function generateLinkFromNote(note: Note): string {
  const { authorName, authorTrustrootsUsername, authorTripHoppingUserId } =
    note;
  if (authorTrustrootsUsername.length > 3) {
    if (authorName.length > 1) {
      return ` <a href="https://www.trustroots.org/profile/${authorTrustrootsUsername}" target="_blank">${authorName}</a>`;
    }
    return ` <a href="https://www.trustroots.org/profile/${authorTrustrootsUsername}" target="_blank">${authorTrustrootsUsername}</a>`;
  }

  if (authorTripHoppingUserId.length > 3) {
    if (authorName.length > 1) {
      return ` <a href="https://www.triphopping.com/profile/${authorTripHoppingUserId}" target="_blank">${authorName}</a>`;
    }
    return ` <a href="https://www.triphopping.com/profile/${authorTripHoppingUserId}" target="_blank">${authorTripHoppingUserId.slice(
      0,
      5
    )}</a>`;
  }
  return "";
}

function generateMapContentFromNotes(notes: Note[]) {
  const lines = notes.reduce((existingLines, note) => {
    const link = generateLinkFromNote(note);
    const datetime = generateDatetimeFromNote(note);
    const noteContent = `${note.content}${link} ${datetime}`;
    return existingLines.concat(noteContent);
  }, [] as string[]);
  const content = lines.join("<br />");
  return content;
}

// todo: needs to be DRYed up
function generateChatContentFromNotes(notes: Note[]) {
  const lines = notes.reduce((existingLines, note) => {
    const link = generateLinkFromNote(note);
    const datetime = generateDatetimeFromNote(note);
    const noteContent = `${datetime}, ${link}: ${note.content}`;
    return existingLines.concat(noteContent);
  }, [] as string[]);
  const content = lines.join("<br />");
  return content;
}

function addNoteToMap(note: Note) {
  let existing = plusCodesWithPopupsAndNotes[note.plusCode];

  if (existing) {
    const popup = existing.popup;

    // When using multiple NOSTR relays, deduplicate the notes by ID to ensure
    // that we don't show the same note multiple times.
    const noteAlreadyOnTheMap = existing.notes.find((n) => n.id === note.id);
    if (typeof noteAlreadyOnTheMap !== "undefined") {
      return;
    }

    const notes = [...existing.notes, note];
    popup.setContent(generateMapContentFromNotes(notes));
  } else {
    const decodedCoords = decode(note.plusCode);
    const {
      resolution: res,
      longitude: cLong,
      latitude: cLat,
    } = decodedCoords!;

    let color;
    let fillColor;
    const hitchWikiYellow = "#F3DA71";
    const hitchWikiYellowLight = "#FFFBEE";
    const trGreen = "#12B591";

    if (note.authorPublicKey === HITCHMAPS_AUTHOR_PUBLIC_KEY) {
      color = hitchWikiYellow;
      fillColor = hitchWikiYellowLight;
    } else {
      color = trGreen;
    }

    const marker = L.circleMarker([cLat, cLong], {
      ...circleMarker,
      color: color,
      fillColor: fillColor,
    }); // Create marker with decoded coordinates
    marker.addTo(map);

    const contentMap = generateMapContentFromNotes([note]);
    const contentChat = generateChatContentFromNotes([note]);

    //todo: rename addNoteToMap and other map
    console.log(note);
    const geochatNotes = document.getElementById(
      "geochat-notes"
    ) as HTMLElement;
    const li = document.createElement("li");
    li.innerHTML = contentChat;
    geochatNotes.appendChild(li);

    const popup = L.popup().setContent(contentMap);
    marker.bindPopup(popup);
    marker.on("click", () => marker.openPopup());
    plusCodesWithPopupsAndNotes[note.plusCode] = {
      popup,
      notes: [note],
    };
  }
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
    console.log("time", expirationTime);
    const expirationDate = expirationTime
      ? Math.floor(Date.now() / 1000 + expirationTime)
      : null;
    console.log("expiration date", expirationDate), expirationTime;
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
  subscribe({ onNoteReceived: addNoteToMap });
};
mapStartup();
