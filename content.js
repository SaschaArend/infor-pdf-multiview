// --- Injection von intercept.js ---
console.log("Infor Multiview: content.js gestartet in Frame " + window.location.href);

const s = document.createElement('script');
s.src = chrome.runtime.getURL('intercept.js');
s.onload = function () {
    console.log("Infor Multiview: intercept.js erfolgreich in DOM injiziert.");
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

// --- Event Listener für Nachrichten aus dem Seitenkontext ---
window.addEventListener('message', function (event) {
    // Hier KEIN event.source !== window, da die Nachricht aus einem untergeordneten iFrame (dem LN iFrame) 
    // an top.window geschickt wird und wir im Top-Window sitzen!
    if (event.data && event.data.type === 'INFOR_MULTIVIEW_PDF_URL') {
        console.log("Infor Multiview: Message erhalten mit URL:", event.data.url);
        // Wir zeichnen das Overlay nur im Top-Window auf, da dieses den "LN" Tab (die Shell) besitzt.
        showPdfOverlay(event.data.url);
    }
});

// Listener beibehalten, falls wir es in Zukunft noch brauchen
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "showOverlay" && request.pdfUrl) {
        showPdfOverlay(request.pdfUrl);
    }
    if (request.type === "UPDATE_AVAILABLE") {
        showUpdateBanner(request.version);
    }
});

// Prüfe beim Laden der Seite, ob im Hintergrund bereits ein Update gefunden wurde
chrome.storage.local.get(['updateAvailable', 'version'], (result) => {
    if (result.updateAvailable) {
        showUpdateBanner(result.version);
    }
});

function showUpdateBanner(version) {
    // Nur im Top-Window anzeigen, um doppelte Banner in iFrames zu vermeiden
    if (window !== window.top) return;

    if (document.getElementById('infor-update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'infor-update-banner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background-color: #ffffff;
        color: #333333;
        padding: 10px 24px;
        z-index: 100000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 13px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        border-bottom: 1px solid #d4d4d4;
        animation: slideDown 0.3s ease-out;
        box-sizing: border-box;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    banner.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; flex-grow: 1;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#005B9F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span style="font-weight: 600; margin-right: 6px; color: #005B9F;">Update Information:</span>
            <span>Eine neue Version der Multiview-Erweiterung (<strong>${version}</strong>) ist verfügbar. Öffne den Update-Ordner, um dort die <strong>update.bat</strong> auszuführen.</span>
            <button id="open-update-folder-btn" style="
                margin-left: 15px;
                padding: 4px 12px;
                background-color: #005B9F;
                color: #ffffff;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 600;
                font-size: 12px;
                transition: background-color 0.2s;
            " onmouseover="this.style.backgroundColor='#004375'" onmouseout="this.style.backgroundColor='#005B9F'">
                Update-Ordner öffnen
            </button>
        </div>
        <button id="close-update-banner" style="
            background: transparent;
            border: none;
            color: #666666;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            padding: 0 8px;
            line-height: 1;
            transition: color 0.2s;
        " onmouseover="this.style.color='#000'" onmouseout="this.style.color='#666'">×</button>
    `;

    document.body.appendChild(banner);

    document.getElementById('close-update-banner').addEventListener('click', () => {
        banner.remove();
    });

    document.getElementById('open-update-folder-btn').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "openExtensionsPage" });
        banner.remove();
    });
}

function showPdfOverlay(pdfUrl) {
    const lnTabActive = document.querySelector('portal-tab-item[aria-label="LN"][aria-selected="true"]');
    if (!lnTabActive) {
        console.log("Infor Multiview: Overlay abgebrochen, da 'portal-tab-item[aria-label=\"LN\"]' nicht aktiv oder nicht gefunden wurde. Dies ist normal in Unter-iFrames.");
        return;
    }

    console.log("Infor Multiview: Zeichne PDF-Overlay mit URL...");

    let container = document.getElementById('pdf-container');
    if (container) {
        const iframe = container.querySelector('iframe');
        if (iframe) iframe.src = pdfUrl;
        return;
    }

    let savedWidth = localStorage.getItem('pdfWidth') || '50%';
    container = document.createElement('div');
    container.id = 'pdf-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.right = '0';
    container.style.height = '100%';
    container.style.width = savedWidth;
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.background = '#fff';
    container.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
    container.style.transition = 'width 0.25s ease';

    const iframe = document.createElement('iframe');
    iframe.src = pdfUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    // Panel
    const panel = document.createElement('div');
    panel.style.position = 'absolute';
    panel.style.top = '10px';
    panel.style.left = '-220px';
    panel.style.background = '#f9f9f9';
    panel.style.padding = '12px';
    panel.style.border = '1px solid #ccc';
    panel.style.borderRadius = '6px';
    panel.style.boxShadow = '0 0 8px rgba(0,0,0,0.2)';
    panel.style.width = '200px';
    panel.style.fontFamily = 'sans-serif';
    panel.style.display = 'none';
    panel.style.zIndex = '9999';

    // Toggle Button
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '+';
    toggleBtn.style.position = 'absolute';
    toggleBtn.style.top = '0';
    toggleBtn.style.left = '-40px';
    toggleBtn.style.height = '40px';
    toggleBtn.style.background = '#333';
    toggleBtn.style.color = '#fff';
    toggleBtn.style.border = 'none';
    toggleBtn.style.padding = '6px 12px';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.fontSize = '20px';
    toggleBtn.style.borderRadius = '4px';
    toggleBtn.style.zIndex = '10000';
    toggleBtn.addEventListener('click', () => {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    // Buttons für Breitenanpassung

    const btn35 = document.createElement('button');
    btn35.textContent = 'Standard Ansicht';
    btn35.style.marginTop = '8px';
    btn35.style.width = '100%';
    btn35.style.padding = '6px';
    btn35.style.cursor = 'pointer';
    btn35.style.background = '#555';
    btn35.style.color = '#fff';
    btn35.style.border = 'none';
    btn35.style.borderRadius = '4px';
    btn35.addEventListener('click', () => {
        container.style.width = '35%';
        localStorage.setItem('pdfWidth', '35%');
    });

    // Reset Button
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Vergrößerte Ansicht';
    resetBtn.style.marginTop = '8px';
    resetBtn.style.width = '100%';
    resetBtn.style.padding = '6px';
    resetBtn.style.cursor = 'pointer';
    resetBtn.style.background = '#555';
    resetBtn.style.color = '#fff';
    resetBtn.style.border = 'none';
    resetBtn.style.borderRadius = '4px';
    resetBtn.addEventListener('click', () => {
        container.style.width = '50%';
        localStorage.setItem('pdfWidth', '50%');
    });

    // Close Button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.background = '#000';
    closeBtn.style.color = '#fff';
    closeBtn.style.border = 'none';
    closeBtn.style.padding = '6px 12px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.borderRadius = '4px';
    closeBtn.style.zIndex = '10000';
    closeBtn.addEventListener('click', () => container.remove());

    // Panel zusammenbauen
    panel.appendChild(btn35);
    panel.appendChild(resetBtn);
    container.appendChild(iframe);
    container.appendChild(toggleBtn);
    container.appendChild(closeBtn);
    container.appendChild(panel);
    document.body.appendChild(container);

    // Watcher: Schließt Container, wenn LN nicht mehr aktiv ist
    const observer = new MutationObserver(() => {
        const lnTabStillActive = document.querySelector('portal-tab-item[aria-label="LN"][aria-selected="true"]');
        if (!lnTabStillActive && document.getElementById('pdf-container')) {
            document.getElementById('pdf-container').remove();
            observer.disconnect(); // Beobachtung beenden
        }
    });
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
}