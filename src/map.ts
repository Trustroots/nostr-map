import L from "leaflet";
import "leaflet.sidepanel";
import { decode, encode } from "pluscodes";
import { hasPrivateKey } from "./nostr/keys";
import { createNote } from "./nostr/notes";
import { _initRelays } from "./nostr/relays";
import { subscribe } from "./nostr/subscribe";
import { PANEL_CONTAINER_ID, BADGE_CONTAINER_ID } from "./constants";
import { Note } from "./types";
import { startUserOnboarding } from "./onboarding";

const map = L.map("map", {
  zoomControl: false,
}).setView([51.505, -0.09], 11);

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
  console.log("#bG7CWu Right clicked or long pressed");
  const isLoggedIn = await hasPrivateKey();

  if (!isLoggedIn) {
    startUserOnboarding();
    return;
  }

  const coords = { latitude: event.latlng.lat, longitude: event.latlng.lng };
  const plusCode = encode(coords, 6)!;

  const selectedPlusCodePoly = generatePolygonFromPlusCode(plusCode);

  selectedPlusCodePoly.setStyle({ color: "grey" });
  selectedPlusCodePoly.addTo(map);

  const createNoteCallback = async (content) => {
    createNote({ content, plusCode });
  };

  const popupContent = createPopupHtml(createNoteCallback);

  L.popup()
    .setLatLng(event.latlng)
    .setContent(popupContent)
    .openOn(map)
    .on("remove", (e) => selectedPlusCodePoly.remove());
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

function generateLinkFromNote(note: Note): string {
  const { authorName, authorTrustrootsUsername, authorTripHoppingUserId } =
    note;

  if (authorTrustrootsUsername.length > 3) {
    if (authorName.length > 1) {
      return ` by <a href="https://www.trustroots.org/profile/${authorTrustrootsUsername}">${authorName}</a>`;
    }
    return ` by <a href="https://www.trustroots.org/profile/${authorTrustrootsUsername}">${authorTrustrootsUsername}</a>`;
  }

  if (authorTripHoppingUserId.length > 3) {
    if (authorName.length > 1) {
      return ` by <a href="https://www.triphopping.com/profile/${authorTripHoppingUserId}">${authorName}</a>`;
    }
    return ` by <a href="https://www.triphopping.com/profile/${authorTripHoppingUserId}">${authorTripHoppingUserId.slice(
      0,
      5
    )}</a>`;
  }
  return "";
}

function generateContentFromNotes(notes: Note[]) {
  const lines = notes.reduce((existingLines, note) => {
    const link = generateLinkFromNote(note);
    const noteContent = `${note.content}${link}`;
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
    popup.setContent(generateContentFromNotes(notes));
  } else {
    const poly = generatePolygonFromPlusCode(note.plusCode);
    poly.setStyle({ color: "blue" });
    poly.addTo(map);

    const content = generateContentFromNotes([note]);
    const popup = L.popup().setContent(content);
    poly.bindPopup(popup);
    poly.on("click", () => poly.openPopup());
    plusCodesWithPopupsAndNotes[note.plusCode] = {
      popup,
      notes: [note],
    };
  }
}

function createPopupHtml(createNoteCallback) {
  const popupContainer = document.createElement("div");
  popupContainer.className = "popup-container";
  const contentInput = document.createElement("input");
  contentInput.id = "content";
  contentInput.type = "text";
  contentInput.required = true;
  contentInput.placeholder = "What do you want to say about this area?";
  const submitButton = document.createElement("button");
  submitButton.innerText = "Add Note!";
  submitButton.onclick = () => {
    const content = contentInput.value;
    createNoteCallback(content);
    map.closePopup();
  };
  popupContainer.appendChild(contentInput);
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
