// Die alte Rate-Limited Stream Interception wurde entfernt.
// Die Extension greift nun den Such Request in content.js via intercept.js ab.

chrome.runtime.onInstalled.addListener(() => {
  console.log("Infor Multiview Extension installiert/aktualisiert.");
  checkForUpdate();

  // Setze den initialen Status auf an (isEnabled: true)
  chrome.storage.local.get(['isEnabled'], (result) => {
    if (result.isEnabled === undefined) {
      chrome.storage.local.set({ isEnabled: true });
    }
  });
});

chrome.runtime.onStartup.addListener(() => {
  checkForUpdate();
});

async function checkForUpdate() {
  const GITHUB_MANIFEST_URL = "https://raw.githubusercontent.com/SaschaArend/infor-pdf-multiview/main/manifest.json";

  try {
    const response = await fetch(GITHUB_MANIFEST_URL);
    const remoteManifest = await response.json();
    const localVersion = chrome.runtime.getManifest().version;
    const remoteVersion = remoteManifest.version;

    if (isNewerVersion(localVersion, remoteVersion)) {
      console.log(`Neue Version verfügbar: ${remoteVersion} (Lokal: ${localVersion})`);

      // Speichere den Status permanent, damit content.js ihn beim Laden abrufen kann
      chrome.storage.local.set({
        updateAvailable: true,
        version: remoteVersion
      });

      // Benachrichtige zusätzlich alle bereits offenen Tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            type: "UPDATE_AVAILABLE",
            version: remoteVersion
          }).catch(() => { });
        });
      });
    } else {
      // Falls wir wieder aktuell sind (z.B. nach manuellem Update), Status löschen
      chrome.storage.local.set({ updateAvailable: false });
    }
  } catch (error) {
    console.error("Fehler beim Prüfen auf Updates:", error);
  }
}

function isNewerVersion(local, remote) {
  const l = local.split('.').map(Number);
  const r = remote.split('.').map(Number);
  for (let i = 0; i < Math.max(l.length, r.length); i++) {
    if ((r[i] || 0) > (l[i] || 0)) return true;
    if ((r[i] || 0) < (l[i] || 0)) return false;
  }
  return false;
}

// Empfange Nachrichten von content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openExtensionsPage") {
    // Öffnet die Detailseite der eigenen Extension, funktioniert in Edge (wird automatisiert umgeleitet) und Chrome
    chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` });
  }
});

// Initialer Badge Status
chrome.storage.local.get(['isEnabled'], (result) => {
  const isEnabled = result.isEnabled !== false; // Default true
  updateBadge(isEnabled);
});

// Toggle Funktionalität über das Extension Icon
chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get(['isEnabled'], (result) => {
    // Wenn isEnabled false ist, wird newState true (anschalten), sonst false (ausschalten)
    const newState = result.isEnabled === false;
    chrome.storage.local.set({ isEnabled: newState });
    updateBadge(newState);

    if (!newState) {
      // Wenn ausgeschaltet wird, weise alle Tabs an, das Overlay zu schließen
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(t => {
          chrome.tabs.sendMessage(t.id, { type: "CLOSE_OVERLAY" }).catch(() => { });
        });
      });
    }
  });
});

function updateBadge(isEnabled) {
  if (isEnabled) {
    chrome.action.setBadgeText({ text: "" });
  } else {
    chrome.action.setBadgeText({ text: "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
  }
}