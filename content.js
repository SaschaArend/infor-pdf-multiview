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
    if (document.getElementById('infor-update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'infor-update-banner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background: linear-gradient(90deg, #1e3a8a, #3b82f6);
        color: white;
        padding: 12px 24px;
        z-index: 100000;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Segoe UI', system-ui, sans-serif;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        animation: slideDown 0.5s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    banner.innerHTML = `
        <div style="font-weight: 600; margin-right: 15px; display: flex; align-items: center;">
            <span style="font-size: 20px; margin-right: 8px;">🚀</span>
            Neue Version verfügbar: <strong>${version}</strong>
        </div>
        <div style="font-size: 14px; color: #dbeafe;">
            Bitte führe die <strong>update.bat</strong> in deinem Installationsordner aus.
        </div>
        <button id="close-update-banner" style="
            margin-left: 20px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 5px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.2s;
        ">×</button>
    `;

    document.body.appendChild(banner);

    document.getElementById('close-update-banner').addEventListener('click', () => {
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