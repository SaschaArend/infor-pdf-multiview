// Die alte Rate-Limited Stream Interception wurde entfernt.
// Die Extension greift nun den Such Request in content.js via intercept.js ab.

chrome.runtime.onInstalled.addListener(() => {
  console.log("Infor Multiview Extension installiert/aktualisiert.");
  checkForUpdate();
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