// Die alte Rate-Limited Stream Interception wurde entfernt.
// Die Extension greift nun den Such Request in content.js via intercept.js ab.

chrome.runtime.onInstalled.addListener(() => {
  console.log("Infor Multiview Extension installiert/aktualisiert (XHR Interception Modus).");
});