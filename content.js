// --- Injection von intercept.js geschieht nun nativ durch Chrome via manifest.json (world: MAIN) ---
console.log("Infor Multiview: content.js gestartet in Frame " + window.location.href);

// --- Event Listener für Nachrichten aus dem Seitenkontext ---
window.addEventListener('message', function (event) {
    // Hier KEIN event.source !== window, da die Nachricht aus einem untergeordneten iFrame (dem LN iFrame) 
    // an top.window geschickt wird und wir im Top-Window sitzen!
    if (event.data && event.data.type === 'INFOR_MULTIVIEW_PDF_URL') {
        console.log("Infor Multiview: Message erhalten mit URL:", event.data.url, "Mimetype:", event.data.mimetype);
        chrome.storage.local.get(['isEnabled'], (result) => {
            if (result.isEnabled !== false) {
                // Wir zeichnen das Overlay nur im Top-Window auf
                showFileOverlay(event.data.url, event.data.mimetype, event.data.auth);
            } else {
                console.log("Infor Multiview: Extension ist ausgeschaltet, Datei-Overlay wird nicht angezeigt.");
            }
        });
    }
});

// Listener beibehalten, falls wir es in Zukunft noch brauchen
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "showOverlay" && request.pdfUrl) {
        chrome.storage.local.get(['isEnabled'], (result) => {
            if (result.isEnabled !== false) {
                showFileOverlay(request.pdfUrl, request.mimetype);
            }
        });
    }
    if (request.type === "UPDATE_AVAILABLE") {
        showUpdateBanner(request.version);
    }
    if (request.type === "CLOSE_OVERLAY") {
        const container = document.getElementById('pdf-container');
        if (container) {
            container.remove();
        }
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#005B9F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span style="font-weight: 600; margin-right: 20px; color: #005B9F; font-size: 14px;">Wichtiges Update (v${version})</span>
            
            <div style="display: flex; align-items: center; gap: 14px; background: #f4f6f8; padding: 4px 16px; border-radius: 8px; border: 1px solid #e1e5ea; font-size: 13px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="color: #6c757d; font-weight: bold;">1.</span>
                    <button id="copy-update-cmd" style="
                        padding: 4px 10px;
                        background-color: #ffffff;
                        color: #005B9F;
                        border: 1px solid #c5d6e3;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 12px;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                    " onmouseover="this.style.backgroundColor='#f0f4f8'; this.style.borderColor='#005B9F'" onmouseout="this.style.backgroundColor='#ffffff'; this.style.borderColor='#c5d6e3'">
                        📋 Befehl kopieren
                    </button>
                </div>
                <span style="color: #ced4da;">|</span>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="color: #6c757d; font-weight: bold;">2.</span>
                    <span><strong>WIN+R</strong> drücken</span>
                </div>
                <span style="color: #ced4da;">|</span>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="color: #6c757d; font-weight: bold;">3.</span>
                    <span>Einfügen <strong>(STRG+V)</strong></span>
                </div>
                <span style="color: #ced4da;">|</span>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="color: #6c757d; font-weight: bold;">4.</span>
                    <span><strong>ENTER</strong> drücken</span>
                </div>
            </div>
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

    document.getElementById('copy-update-cmd').addEventListener('click', (e) => {
        navigator.clipboard.writeText('"%USERPROFILE%\\Infor_Multiview_Extension\\update.bat"').then(() => {
            const btn = e.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ Kopiert!';
            btn.style.backgroundColor = '#d4edda';
            btn.style.borderColor = '#c3e6cb';
            btn.style.color = '#155724';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.backgroundColor = '#ffffff';
                btn.style.borderColor = '#c5d6e3';
                btn.style.color = '#005B9F';
            }, 2000);
        });
    });

    // Polling, um zu prüfen, ob die lokale update.bat das Update durchgeführt hat
    let updatePoll = setInterval(() => {
        if (document.getElementById('infor-update-banner')) {
            try {
                chrome.runtime.sendMessage({ action: "checkLocalUpdateReady" }, (response) => {
                    if (chrome.runtime.lastError) {
                        // Die Erweiterung wurde im Hintergrund neu geladen (alte Skripte sind nun "verwaist")
                        handleUpdateApplied();
                    } else if (response && response.ready) {
                        handleUpdateApplied();
                    }
                });
            } catch (e) {
                handleUpdateApplied();
            }
        } else {
            clearInterval(updatePoll);
        }
    }, 2000);

    function handleUpdateApplied() {
        clearInterval(updatePoll);
        const banner = document.getElementById('infor-update-banner');
        if (banner) {
            banner.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; flex-grow: 1;">
                    <span style="font-weight: 600; color: #155724; font-size: 14px;">✅ Update erfolgreich installiert!</span>
                    <span style="margin-left: 10px; color: #155724; font-size: 14px;">Bitte drücke <strong>F5</strong> (Seite neu laden), um die neue Version zu nutzen.</span>
                </div>
                <button id="close-update-banner-success" style="background: transparent; border: none; color: #666; cursor: pointer; font-size: 18px; font-weight: bold; padding: 0 8px;">×</button>
            `;
            banner.style.backgroundColor = '#d4edda';
            banner.style.borderBottom = '1px solid #c3e6cb';
            
            const closeBtn = document.getElementById('close-update-banner-success');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    banner.remove();
                });
            }
        }
    }
}

function showFileOverlay(fileUrl, mimetype, authHeader = null) {
    // Stellen sicher, dass wir nur im Top-Window zeichnen
    if (window !== window.top) {
        return;
    }

    // Prüfen, ob wir im LN-Tab sind
    const lnTab = document.querySelector('portal-tab-item[aria-label="LN"]');
    if (lnTab && lnTab.getAttribute('aria-selected') !== 'true') {
        console.log("Infor Multiview: Overlay abgebrochen, da LN-Tab nicht aktiv ist.");
        return;
    }

    console.log("Infor Multiview: Zeichne Datei-Overlay mit URL...");

    const isOffice = mimetype === 'application/msword' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/vnd.ms-excel' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    let container = document.getElementById('pdf-container');
    if (container) {
        const contentArea = container.querySelector('#overlay-content-area');
        if (contentArea) {
            contentArea.innerHTML = '';
            appendFileContent(contentArea, fileUrl, mimetype, authHeader);
        }
        return;
    }

    let savedWidth = localStorage.getItem('pdfWidth') || (isOffice ? '30%' : '50%');
    container = document.createElement('div');
    container.id = 'pdf-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.right = '0';
    container.style.height = '100%';
    container.style.width = savedWidth;
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.background = '#fff';
    container.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
    container.style.transition = 'width 0.25s ease';

    const contentArea = document.createElement('div');
    contentArea.id = 'overlay-content-area';
    contentArea.style.flex = '1';
    contentArea.style.display = 'flex';
    contentArea.style.justifyContent = 'center';
    contentArea.style.alignItems = 'center';
    contentArea.style.overflow = 'auto';
    contentArea.style.position = 'relative';

    appendFileContent(contentArea, fileUrl, mimetype, authHeader);


    // Resize Handle (Grip)
    const resizeHandle = document.createElement('div');
    resizeHandle.id = 'overlay-resize-handle';
    resizeHandle.style.position = 'absolute';
    resizeHandle.style.top = '0';
    resizeHandle.style.left = '-12px';
    resizeHandle.style.width = '12px';
    resizeHandle.style.height = '40px';
    resizeHandle.style.background = '#333';
    resizeHandle.style.cursor = 'col-resize';
    resizeHandle.style.display = 'flex';
    resizeHandle.style.alignItems = 'center';
    resizeHandle.style.justifyContent = 'center';
    resizeHandle.style.borderRadius = '4px 0 0 4px';
    resizeHandle.style.zIndex = '10000';
    resizeHandle.style.userSelect = 'none';
    resizeHandle.style.transition = 'background 0.2s, width 0.2s, left 0.2s';

    // Kleines Punkt-Muster für den Griff
    resizeHandle.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="width: 3px; height: 3px; background: rgba(255,255,255,0.4); border-radius: 50%;"></div>
            <div style="width: 3px; height: 3px; background: rgba(255,255,255,0.4); border-radius: 50%;"></div>
            <div style="width: 3px; height: 3px; background: rgba(255,255,255,0.4); border-radius: 50%;"></div>
        </div>
    `;

    resizeHandle.onmouseover = () => {
        resizeHandle.style.background = '#000';
        resizeHandle.style.width = '16px';
        resizeHandle.style.left = '-16px';
    };
    resizeHandle.onmouseout = () => {
        if (!isResizing) {
            resizeHandle.style.background = '#333';
            resizeHandle.style.width = '12px';
            resizeHandle.style.left = '-12px';
        }
    };

    // Resizing Logik
    let isResizing = false;
    let startX, startWidth;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = container.offsetWidth;
        container.style.transition = 'none'; // Ruckelfrei: Animation aus
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        // Iframe Klick-Events unterbinden während Resize
        const iframe = container.querySelector('iframe');
        if (iframe) iframe.style.pointerEvents = 'none';

        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        // Da der Container rechts klebt (right: 0), vergrößert sich die Breite,
        // wenn die Maus sich nach links bewegt (startX - e.clientX).
        const newWidth = startWidth + (startX - e.clientX);

        // Mindest- und Maximalbreite setzen
        const minWidth = 200;
        const maxWidth = window.innerWidth * 0.9;

        if (newWidth > minWidth && newWidth < maxWidth) {
            container.style.width = `${newWidth}px`;
        }
    });

    window.addEventListener('mouseup', () => {
        if (!isResizing) return;

        isResizing = false;
        container.style.transition = 'width 0.25s ease'; // Animation wieder an
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        const iframe = container.querySelector('iframe');
        if (iframe) iframe.style.pointerEvents = 'auto';

        // Neue Breite speichern
        localStorage.setItem('pdfWidth', container.style.width);
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

    // UI zusammenbauen
    container.appendChild(contentArea);
    container.appendChild(resizeHandle);
    container.appendChild(closeBtn);
    document.body.appendChild(container);

    // Watcher: Schließt das Overlay automatisch, wenn der LN-Tab verlassen wird
    const checkTabInterval = setInterval(() => {
        if (!document.getElementById('pdf-container')) {
            clearInterval(checkTabInterval);
            return;
        }
        const activeTab = document.querySelector('portal-tab-item[aria-label="LN"]');
        if (activeTab && activeTab.getAttribute('aria-selected') !== 'true') {
            console.log("Infor Multiview: LN-Tab wurde verlassen, schließe Overlay.");
            container.remove();
            clearInterval(checkTabInterval);
        }
    }, 1000);
}

function appendFileContent(parent, fileUrl, mimetype, authHeader = null) {
    if (mimetype && mimetype.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = fileUrl;
        img.style.maxWidth = '90%';
        img.style.maxHeight = '90%';
        img.style.objectFit = 'contain';
        img.style.boxShadow = '0 0 20px rgba(0,0,0,0.1)';
        img.style.background = '#fff';
        parent.appendChild(img);
    } else if (mimetype === 'application/msword' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/vnd.ms-excel' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {

        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';

        const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : (window.location.origin + fileUrl);

        const iframe = document.createElement('iframe');
        iframe.src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}`;
        iframe.style.flex = '1';
        iframe.style.width = '100%';
        iframe.style.border = 'none';

        // Kleinere Fußzeile für den Download-Fallback
        const footer = document.createElement('div');
        footer.style.padding = '8px';
        footer.style.background = '#f1f1f1';
        footer.style.borderTop = '1px solid #ccc';
        footer.style.textAlign = 'right';

        const dlBtn = document.createElement('button');
        dlBtn.textContent = 'Datei manuell herunterladen';
        dlBtn.style.padding = '4px 8px';
        dlBtn.style.fontSize = '11px';
        dlBtn.style.cursor = 'pointer';
        dlBtn.style.background = '#005B9F';
        dlBtn.style.color = '#fff';
        dlBtn.style.border = 'none';
        dlBtn.style.borderRadius = '3px';
        dlBtn.onclick = () => {
            const absoluteUrl = new URL(fileUrl, window.location.origin).href;
            console.log("Infor Multiview: Sende Download-Request an Background (Office):", absoluteUrl);
            chrome.runtime.sendMessage({ action: 'downloadFile', url: absoluteUrl });
        };

        footer.appendChild(dlBtn);
        container.appendChild(iframe);
        container.appendChild(footer);
        parent.appendChild(container);
    } else if (mimetype === 'message/rfc822') {
        const viewer = document.createElement('div');
        viewer.style.cssText = 'width: 100%; height: 100%; display: flex; flex-direction: column; background: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;';

        const loader = document.createElement('div');
        loader.textContent = 'Lade E-Mail...';
        loader.style.padding = '20px';
        viewer.appendChild(loader);
        parent.appendChild(viewer);

        const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : (window.location.origin + fileUrl);

        chrome.runtime.sendMessage({ action: 'fetchText', url: absoluteUrl }, (response) => {
            if (response && response.success) {
                const text = response.text;
                loader.remove();

                // Verbesserter E-Mail Parser
                function decodeQP(str) {
                    return str.replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16))).replace(/=\r?\n/g, '');
                }

                const lines = text.split(/\r?\n/);
                const headers = {};
                let bodyIndex = 0;

                for (let i = 0; i < lines.length; i++) {
                    if (lines[i] === '') {
                        bodyIndex = i + 1;
                        break;
                    }
                    const parts = lines[i].split(/:\s+/);
                    if (parts.length > 1) {
                        headers[parts[0].toLowerCase()] = parts.slice(1).join(': ');
                    }
                }

                let body = lines.slice(bodyIndex).join('\n');

                // Einfaches Handling von Multi-part Boundaries
                const contentType = headers['content-type'] || '';
                const boundaryMatch = contentType.match(/boundary="?([^"; ]+)"?/i);
                if (boundaryMatch) {
                    const boundary = boundaryMatch[1];
                    const parts = body.split('--' + boundary);
                    // Suche nach dem ersten relevanten Text-Teil (plain oder html)
                    const textPart = parts.find(p => p.toLowerCase().includes('content-type: text/plain')) || parts[1];
                    if (textPart) {
                        const subLines = textPart.trim().split('\n');
                        const subBodyIndex = subLines.findIndex(l => l.trim() === '');
                        body = subLines.slice(subBodyIndex + 1).join('\n');

                        if (textPart.toLowerCase().includes('quoted-printable')) {
                            body = decodeQP(body);
                        }
                    }
                } else if (contentType.toLowerCase().includes('quoted-printable') || (headers['content-transfer-encoding'] || '').toLowerCase().includes('quoted-printable')) {
                    body = decodeQP(body);
                }

                viewer.innerHTML = `
                    <div style="padding: 20px; border-bottom: 1px solid #eee; background: #fdfdfd;">
                        <div style="font-size: 18px; font-weight: 600; color: #111; margin-bottom: 12px;">${headers.subject || '(Kein Betreff)'}</div>
                        <div style="font-size: 13px; color: #555; display: grid; grid-template-columns: 80px 1fr; gap: 4px;">
                            <span style="font-weight: 600;">Von:</span> <span>${headers.from || ''}</span>
                            <span style="font-weight: 600;">An:</span> <span>${headers.to || ''}</span>
                            <span style="font-weight: 600;">Datum:</span> <span>${headers.date || ''}</span>
                        </div>
                    </div>
                    <div style="flex: 1; padding: 20px; overflow-y: auto; white-space: pre-wrap; font-size: 14px; color: #333; line-height: 1.6;">${body.trim()}</div>
                    <div style="padding: 8px; background: #f1f1f1; border-top: 1px solid #ccc; text-align: right;">
                        <button id="eml-dl-btn" style="padding: 4px 8px; font-size: 11px; cursor: pointer; background: #005B9F; color: #fff; border: none; border-radius: 3px;">
                            Original EML herunterladen
                        </button>
                    </div>
                `;

                const triggerDownload = (url) => {
                    const absoluteUrl = new URL(url, window.location.origin).href;
                    console.log("Infor Multiview: Sende Download-Request an Background:", absoluteUrl);
                    chrome.runtime.sendMessage({ action: 'downloadFile', url: absoluteUrl });
                };

                viewer.querySelector('#eml-dl-btn').onclick = () => triggerDownload(fileUrl);
            } else {
                loader.textContent = 'Fehler beim Laden der E-Mail: ' + (response ? response.error : 'Keine Antwort');
                console.error("EML load error:", response);
            }
        });
    } else if (mimetype === 'application/vnd.ms-outlook') {
        const viewer = document.createElement('div');
        viewer.style.cssText = 'width: 100%; height: 100%; display: flex; flex-direction: column; background: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;';

        const loader = document.createElement('div');
        loader.textContent = 'Lade MSG Datei...';
        loader.style.padding = '20px';
        viewer.appendChild(loader);
        parent.appendChild(viewer);

        const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : (window.location.origin + fileUrl);

        chrome.runtime.sendMessage({ action: 'fetchArrayBuffer', url: absoluteUrl }, (response) => {
            if (response && response.success) {
                loader.remove();
                try {
                    const uint8Array = new Uint8Array(response.bytes);
                    const buffer = uint8Array.buffer;
                    const msgReader = new MSGReader(buffer);
                    const fileData = msgReader.getFileData();

                    if (!fileData.error) {
                        // Inline-Bilder verarbeiten (CID-Replacement via Base64 Data-URLs für srcdoc)
                        let htmlBody = fileData.bodyHTML ? String(fileData.bodyHTML) : null;
                        if (htmlBody && fileData.attachments && fileData.attachments.length > 0) {
                            fileData.attachments.forEach((attach, index) => {
                                if (attach.pidContentId) {
                                    try {
                                        const attachment = msgReader.getAttachment(index);
                                        if (attachment && attachment.content) {
                                            const uint8 = new Uint8Array(attachment.content);
                                            let binary = '';
                                            for (let i = 0; i < uint8.byteLength; i++) binary += String.fromCharCode(uint8[i]);
                                            const base64 = btoa(binary);
                                            const mimeType = attach.mimeType || 'image/png';
                                            const dataUrl = `data:${mimeType};base64,${base64}`;

                                            // CID in verschiedenen Formaten ersetzen
                                            const cidClean = attach.pidContentId.replace(/^<|>$/g, '');
                                            const cidBase = cidClean.split('@')[0];
                                            [cidClean, cidBase].forEach(cid => {
                                                const escaped = cid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                                htmlBody = htmlBody.replace(new RegExp(`cid:${escaped}`, 'gi'), dataUrl);
                                            });
                                        }
                                    } catch (e) {
                                        console.warn("Infor Multiview: Konnte Inline-Bild nicht laden:", attach.pidContentId, e);
                                    }
                                }
                            });
                        }


                        let dateStr = '';
                        if (fileData.headers) {
                            const dateMatch = fileData.headers.match(/^Date:\s*(.*)$/m);
                            if (dateMatch) dateStr = dateMatch[1];
                        }

                        // Header-Bereich DOM-basiert aufbauen
                        const header = document.createElement('div');
                        header.style.cssText = 'padding: 20px; border-bottom: 1px solid #eee; background: #fdfdfd; flex-shrink: 0;';
                        header.innerHTML = `
                            <div style="font-size: 18px; font-weight: 600; color: #111; margin-bottom: 12px;">${fileData.subject || '(Kein Betreff)'}</div>
                            <div style="font-size: 13px; color: #555; display: grid; grid-template-columns: 80px 1fr; gap: 4px;">
                                <span style="font-weight: 600;">Von:</span> <span>${fileData.senderName || ''} ${fileData.senderEmail ? `&lt;${fileData.senderEmail}&gt;` : ''}</span>
                                <span style="font-weight: 600;">An:</span> <span>${(fileData.recipients || []).map(r => r.name || r.email).join(', ')}</span>
                                <span style="font-weight: 600;">Datum:</span> <span>${dateStr}</span>
                            </div>
                        `;

                        // Body in isoliertem iframe rendern (umgeht CSP der Seite)
                        const bodyFrame = document.createElement('iframe');
                        bodyFrame.style.cssText = 'flex: 1; width: 100%; border: none;';
                        bodyFrame.sandbox = 'allow-same-origin';

                        const bodyHtmlDoc = htmlBody
                            ? `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:16px;font-family:sans-serif;font-size:14px;color:#333;}</style></head><body>${htmlBody}</body></html>`
                            : `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:16px;font-family:sans-serif;font-size:14px;color:#333;white-space:pre-wrap;line-height:1.6;}</style></head><body>${fileData.body || ''}</body></html>`;

                        bodyFrame.srcdoc = bodyHtmlDoc;

                        const footer = document.createElement('div');
                        footer.style.cssText = 'padding: 8px; background: #f1f1f1; border-top: 1px solid #ccc; text-align: right; flex-shrink: 0;';
                        footer.innerHTML = `<button id="msg-dl-btn" style="padding: 4px 8px; font-size: 11px; cursor: pointer; background: #005B9F; color: #fff; border: none; border-radius: 3px;">Original MSG herunterladen</button>`;

                        viewer.appendChild(header);
                        viewer.appendChild(bodyFrame);
                        viewer.appendChild(footer);

                        viewer.querySelector('#msg-dl-btn').onclick = () => {
                            chrome.runtime.sendMessage({ action: 'downloadFile', url: absoluteUrl });
                        };
                    } else {
                        viewer.innerHTML = `<div style="padding:20px; color:red;">Fehler beim Parsen der MSG: ${fileData.error}</div>`;
                    }
                } catch (e) {
                    console.error("MSG process error:", e);
                    viewer.innerHTML = `<div style="padding:20px; color:red;">Fehler beim Verarbeiten der MSG: ${e.message}</div>`;
                }
            } else {
                loader.textContent = 'Fehler beim Laden der MSG Datei: ' + (response ? response.error : 'Keine Antwort');
            }
        });
    } else {
        // Default (PDF)
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        parent.appendChild(iframe);

        const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : (window.location.origin + fileUrl);
        
        // Hole die PDF über den Background-Worker als Base64, um CORS und X-Frame-Options sicher zu umgehen
        chrome.runtime.sendMessage({ action: 'fetchBase64', url: absoluteUrl, auth: authHeader }, (response) => {
            if (response && response.success && response.base64) {
                try {
                    const byteCharacters = atob(response.base64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: mimetype || 'application/pdf' });
                    const blobUrl = URL.createObjectURL(blob);
                    iframe.src = blobUrl;
                } catch (err) {
                    console.error("Infor Multiview: Base64 to Blob failed", err);
                    iframe.src = absoluteUrl;
                }
            } else {
                console.error("Infor Multiview: Background fetch failed", response ? response.error : "Unknown error");
                iframe.src = absoluteUrl; // Fallback
            }
        });
    }
}