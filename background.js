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

  if (request.action === "fetchText" && request.url) {
    fetch(request.url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.text();
      })
      .then(text => sendResponse({ success: true, text: text }))
      .catch(error => {
        console.error("Background fetch error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Hält den Nachrichtenkanal für asynchrone Antwort offen
  }

  if (request.action === "fetchArrayBuffer" && request.url) {
    fetch(request.url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.arrayBuffer();
      })
      .then(buffer => {
        const uint8Array = new Uint8Array(buffer);
        const bytes = Array.from(uint8Array);
        sendResponse({ success: true, bytes: bytes });
      })
      .catch(error => {
        console.error("Background fetch arraybuffer error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === "fetchBase64" && request.url) {
    const fetchOpts = { credentials: 'include' };
    if (request.auth) fetchOpts.headers = { 'Authorization': request.auth };

    fetch(request.url, fetchOpts)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.arrayBuffer();
      })
      .then(buffer => {
        // ArrayBuffer zu Base64 konvertieren im Service Worker
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        sendResponse({ success: true, base64: base64 });
      })
      .catch(error => {
        console.error("Background fetch base64 error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === "downloadFile" && request.url) {
    console.log("Infor Multiview: Starte Download via Background:", request.url);
    chrome.downloads.download({
      url: request.url
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Infor Multiview: Download fehlgeschlagen:", chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log("Infor Multiview: Download erfolgreich gestartet, ID:", downloadId);
        sendResponse({ success: true, downloadId: downloadId });
      }
    });
    return true;
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