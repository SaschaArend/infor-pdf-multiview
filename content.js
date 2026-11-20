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
    } else if (event.data && event.data.type === 'INFOR_MULTIVIEW_REOPEN_IF_CLOSED') {
        if (window === window.top && !document.getElementById('pdf-container')) {
            chrome.storage.local.get(['isEnabled'], (result) => {
                if (result.isEnabled !== false) {
                    showFileOverlay(event.data.url, event.data.mimetype, event.data.auth);
                }
            });
        }
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
    if (request.type === "OPEN_ZUGFERD_CHECKER") {
        if (window === window.top) {
            showZugferdCheckerOverlay();
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

function formatPrettyXml(xml) {
    let formatted = '';
    const reg = /(>)(<)(\/*)/g;
    const cleaned = xml.replace(/\r\n/g, '\n').replace(/>\s+</g, '><').replace(reg, '$1\n$2$3');
    let pad = 0;
    const lines = cleaned.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let ln = lines[i];
        let indent = 0;
        if (ln.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        } else if (ln.match(/^<\/\w/)) {
            if (pad !== 0) pad -= 1;
        } else if (ln.match(/^<\w[^>]*[^\/]>.*$/)) {
            indent = 1;
        } else {
            indent = 0;
        }
        formatted += '  '.repeat(pad) + ln + '\n';
        pad += indent;
    }
    return formatted.trim();
}

function renderZugferdOverlay(parent, xmlText, fileUrl, options = {}) {
    parent.innerHTML = '';

    const viewer = document.createElement('div');
    viewer.style.cssText = 'width: 100%; height: 100%; display: flex; flex-direction: column; background: #eef2f6;';

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const parseError = xmlDoc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
        viewer.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">Fehler beim Parsen der XML-Datei.</div>`;
        parent.appendChild(viewer);
        return;
    }

    const rootName = xmlDoc.documentElement ? xmlDoc.documentElement.localName : '';
    const isCII = rootName === 'CrossIndustryInvoice' || xmlText.includes('CrossIndustryInvoice');
    const isUBL = rootName === 'Invoice' || rootName === 'CreditNote' || xmlText.includes('urn:oasis:names:specification:ubl');

    if (!isCII && !isUBL) {
        // Fallback: Normale XML-Ansicht
        const pre = document.createElement('pre');
        pre.style.cssText = 'flex: 1; margin: 0; padding: 20px; overflow: auto; font-family: monospace; font-size: 12px; background: #fff; color: #333;';
        pre.textContent = xmlText;
        viewer.appendChild(pre);
        parent.appendChild(viewer);
        return;
    }

    const esc = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const getChild = (el, localName) => {
        if (!el || !el.children) return null;
        for (let i = 0; i < el.children.length; i++) {
            const c = el.children[i];
            if (c.localName === localName || c.nodeName.endsWith(':' + localName) || c.nodeName === localName) {
                return c;
            }
        }
        return null;
    };

    const getChildren = (el, localName) => {
        const res = [];
        if (!el || !el.children) return res;
        for (let i = 0; i < el.children.length; i++) {
            const c = el.children[i];
            if (c.localName === localName || c.nodeName.endsWith(':' + localName) || c.nodeName === localName) {
                res.push(c);
            }
        }
        return res;
    };

    const getVal = (el, ...path) => {
        let cur = el;
        for (const p of path) {
            cur = getChild(cur, p);
            if (!cur) return '';
        }
        return cur.textContent ? cur.textContent.trim() : '';
    };

    const formatDate = (str) => {
        if (!str) return '';
        const s = str.trim();
        if (/^\d{8}$/.test(s)) {
            return `${s.substring(6, 8)}.${s.substring(4, 6)}.${s.substring(0, 4)}`;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const [y, m, d] = s.split('-');
            return `${d}.${m}.${y}`;
        }
        return s;
    };

    const formatAmount = (val, currency = 'EUR') => {
        if (val === '' || val === null || val === undefined) return '';
        const num = parseFloat(String(val).replace(',', '.'));
        if (isNaN(num)) return `${val} ${currency}`.trim();
        return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (currency ? ' ' + currency : '');
    };

    const formatPercent = (val) => {
        if (val === '' || val === null || val === undefined) return '';
        const num = parseFloat(String(val).replace(',', '.'));
        if (isNaN(num)) return `${val}%`;
        return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    };

    const formatQty = (val) => {
        if (val === '' || val === null || val === undefined) return '';
        const num = parseFloat(String(val).replace(',', '.'));
        if (isNaN(num)) return String(val);
        return num.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
    };

    const countryNames = {
        'DE': 'Deutschland',
        'AT': 'Österreich',
        'CH': 'Schweiz',
        'NL': 'Niederlande',
        'FR': 'Frankreich',
        'IT': 'Italien',
        'BE': 'Belgien',
        'LU': 'Luxemburg',
        'PL': 'Polen',
        'ES': 'Spanien',
        'GB': 'Vereinigtes Königreich',
        'US': 'USA'
    };

    let data = {
        docTitle: 'Rechnung',
        invoiceId: '',
        issueDate: '',
        dueDate: '',
        taxPointDate: '',
        billingPeriodStart: '',
        billingPeriodEnd: '',
        currency: 'EUR',
        sellerLines: [],
        buyerLines: [],
        shipToLines: [],
        items: [],
        subtotal: '',
        taxes: [],
        grandTotal: '',
        duePayable: '',
        paymentTerms: '',
        iban: '',
        bic: '',
        buyerRef: '',
        orderRef: '',
        notes: []
    };

    if (isCII) {
        const root = xmlDoc.documentElement;
        const exchDoc = getChild(root, 'ExchangedDocument');
        const transaction = getChild(root, 'SupplyChainTradeTransaction');
        const agreement = getChild(transaction, 'ApplicableHeaderTradeAgreement');
        const delivery = getChild(transaction, 'ApplicableHeaderTradeDelivery');
        const settlement = getChild(transaction, 'ApplicableHeaderTradeSettlement');

        const typeCode = getVal(exchDoc, 'TypeCode');
        if (typeCode === '381' || typeCode === '261') data.docTitle = 'Gutschrift';
        else if (typeCode === '384') data.docTitle = ' Rechnungskorrektur';

        data.invoiceId = getVal(exchDoc, 'ID');
        data.issueDate = formatDate(getVal(exchDoc, 'IssueDateTime', 'DateTimeString') || getVal(exchDoc, 'IssueDateTime'));

        const noteEls = getChildren(exchDoc, 'IncludedNote');
        noteEls.forEach(n => {
            const c = getVal(n, 'Content');
            if (c) data.notes.push(c);
        });

        data.currency = getVal(settlement, 'InvoiceCurrencyCode') || 'EUR';
        data.buyerRef = getVal(agreement, 'BuyerReference');
        data.orderRef = getVal(agreement, 'BuyerOrderReferencedDocument', 'IssuerAssignedID');

        // Seller
        const seller = getChild(agreement, 'SellerTradeParty');
        if (seller) {
            const name = getVal(seller, 'Name');
            if (name) data.sellerLines.push({ text: name, bold: true });

            const addr = getChild(seller, 'PostalTradeAddress');
            if (addr) {
                const l1 = getVal(addr, 'LineOne');
                const l2 = getVal(addr, 'LineTwo');
                const l3 = getVal(addr, 'LineThree');
                const zip = getVal(addr, 'PostcodeCode');
                const city = getVal(addr, 'CityName');
                if (l1) data.sellerLines.push({ text: l1 });
                if (l2) data.sellerLines.push({ text: l2 });
                if (l3) data.sellerLines.push({ text: l3 });
                if (zip || city) data.sellerLines.push({ text: `${zip} ${city}`.trim() });
            }

            const taxRegs = getChildren(seller, 'SpecifiedTaxRegistration');
            taxRegs.forEach(tr => {
                const idEl = getChild(tr, 'ID');
                if (idEl && idEl.textContent.trim()) {
                    const scheme = idEl.getAttribute('schemeID');
                    if (scheme === 'VA') {
                        data.sellerLines.push({ text: `USt-IdNr.: ${idEl.textContent.trim()}` });
                    } else if (scheme === 'FC') {
                        data.sellerLines.push({ text: `Steuernummer: ${idEl.textContent.trim()}` });
                    } else {
                        data.sellerLines.push({ text: idEl.textContent.trim() });
                    }
                }
            });

            const sellerId = getVal(seller, 'ID');
            if (sellerId) {
                data.sellerLines.push({ text: `Steuernummer (St.-Nr.) [Standardschema]:` });
                data.sellerLines.push({ text: sellerId });
            }

            const contact = getChild(seller, 'DefinedTradeContact');
            if (contact) {
                const pName = getVal(contact, 'PersonName') || getVal(contact, 'DepartmentName');
                const tel = getVal(contact, 'TelephoneUniversalCommunication', 'CompleteNumber');
                const mail = getVal(contact, 'EmailURIUniversalCommunication', 'URIID');
                if (pName) data.sellerLines.push({ text: pName });
                if (tel) data.sellerLines.push({ text: tel });
                if (mail) data.sellerLines.push({ text: mail });
            }
        }

        // Buyer
        const buyer = getChild(agreement, 'BuyerTradeParty');
        if (buyer) {
            const name = getVal(buyer, 'Name');
            if (name) data.buyerLines.push({ text: name, bold: true });

            const addr = getChild(buyer, 'PostalTradeAddress');
            if (addr) {
                const l1 = getVal(addr, 'LineOne');
                const l2 = getVal(addr, 'LineTwo');
                const l3 = getVal(addr, 'LineThree');
                const zip = getVal(addr, 'PostcodeCode');
                const city = getVal(addr, 'CityName');
                if (l1) data.buyerLines.push({ text: l1 });
                if (l2) data.buyerLines.push({ text: l2 });
                if (l3) {
                    data.buyerLines.push({ text: l3 });
                } else if (zip || city) {
                    data.buyerLines.push({ text: `${zip} ${city}`.trim() });
                }
            }

            const taxRegs = getChildren(buyer, 'SpecifiedTaxRegistration');
            taxRegs.forEach(tr => {
                const idEl = getChild(tr, 'ID');
                if (idEl && idEl.textContent.trim()) {
                    data.buyerLines.push({ text: idEl.textContent.trim() });
                }
            });

            const buyerId = getVal(buyer, 'ID');
            if (buyerId) {
                data.buyerLines.push({ text: `Steuernummer (St.-Nr.)` });
                data.buyerLines.push({ text: `[Standardschema]: ${buyerId}` });
            }
        }

        // ShipTo
        const shipTo = getChild(delivery, 'ShipToTradeParty');
        if (shipTo) {
            const name = getVal(shipTo, 'Name');
            const id = getVal(shipTo, 'ID');
            if (name) data.shipToLines.push({ text: name });
            if (id) data.shipToLines.push({ text: id });

            const addr = getChild(shipTo, 'PostalTradeAddress');
            if (addr) {
                const l1 = getVal(addr, 'LineOne');
                const l2 = getVal(addr, 'LineTwo');
                const l3 = getVal(addr, 'LineThree');
                const zip = getVal(addr, 'PostcodeCode');
                const city = getVal(addr, 'CityName');
                const country = getVal(addr, 'CountryID');
                if (l1) data.shipToLines.push({ text: l1 });
                if (l2) data.shipToLines.push({ text: l2 });
                if (l3 && l3 !== l2) data.shipToLines.push({ text: l3 });
                if (zip) data.shipToLines.push({ text: zip });
                if (city) data.shipToLines.push({ text: city });
                if (country) data.shipToLines.push({ text: countryNames[country] || country });
            }
        } else {
            const actualDeliv = getVal(delivery, 'ActualDeliverySupplyChainEvent', 'OccurrenceDateTime', 'DateTimeString');
            if (actualDeliv) {
                data.shipToLines.push({ text: `Lieferdatum: ${formatDate(actualDeliv)}` });
            }
        }

        // Settlement Dates & Taxes
        const payTerms = getChild(settlement, 'SpecifiedTradePaymentTerms');
        if (payTerms) {
            data.paymentTerms = getVal(payTerms, 'Description');
            data.dueDate = formatDate(getVal(payTerms, 'DueDateDateTime', 'DateTimeString') || getVal(payTerms, 'DueDateDateTime'));
        }

        const billingPeriod = getChild(settlement, 'BillingSpecifiedPeriod');
        if (billingPeriod) {
            data.billingPeriodStart = formatDate(getVal(billingPeriod, 'StartDateTime', 'DateTimeString'));
            data.billingPeriodEnd = formatDate(getVal(billingPeriod, 'EndDateTime', 'DateTimeString'));
        }

        const headerTaxes = getChildren(settlement, 'ApplicableTradeTax');
        headerTaxes.forEach(t => {
            const tpDate = getVal(t, 'TaxPointDate', 'DateString') || getVal(t, 'TaxPointDate');
            if (tpDate && !data.taxPointDate) data.taxPointDate = formatDate(tpDate);

            data.taxes.push({
                type: getVal(t, 'TypeCode') || 'VAT',
                rate: getVal(t, 'RateApplicablePercent'),
                basis: getVal(t, 'BasisAmount'),
                amount: getVal(t, 'CalculatedAmount')
            });
        });

        const payMeans = getChild(settlement, 'SpecifiedTradeSettlementPaymentMeans');
        if (payMeans) {
            data.iban = getVal(payMeans, 'PayeePartyCreditorFinancialAccount', 'IBANID');
            data.bic = getVal(payMeans, 'PayeeSpecifiedCreditorFinancialInstitution', 'BICID');
        }

        const summation = getChild(settlement, 'SpecifiedTradeSettlementHeaderMonetarySummation');
        if (summation) {
            data.subtotal = getVal(summation, 'TaxBasisTotalAmount') || getVal(summation, 'LineTotalAmount');
            data.grandTotal = getVal(summation, 'GrandTotalAmount');
            data.duePayable = getVal(summation, 'DuePayableAmount');
        }

        // Line Items
        const lineItems = getChildren(transaction, 'IncludedSupplyChainTradeLineItem');
        lineItems.forEach(li => {
            const prod = getChild(li, 'SpecifiedTradeProduct');
            const lineAgree = getChild(li, 'SpecifiedLineTradeAgreement');
            const lineDeliv = getChild(li, 'SpecifiedLineTradeDelivery');
            const lineSettle = getChild(li, 'SpecifiedLineTradeSettlement');

            const name = getVal(prod, 'Name') || getVal(prod, 'Description');
            const qty = getVal(lineDeliv, 'BilledQuantity');
            const netPrice = getVal(lineAgree, 'NetPriceProductTradePrice', 'ChargeAmount');
            const grossPrice = getVal(lineAgree, 'GrossPriceProductTradePrice', 'ChargeAmount');
            const unitPrice = netPrice !== '' ? netPrice : grossPrice;
            const total = getVal(lineSettle, 'SpecifiedTradeSettlementLineMonetarySummation', 'LineTotalAmount');

            data.items.push({
                name: name,
                qty: qty,
                unitPrice: unitPrice,
                total: total
            });
        });
    } else if (isUBL) {
        const root = xmlDoc.documentElement;
        if (root.localName === 'CreditNote') data.docTitle = 'Gutschrift';
        data.invoiceId = getVal(root, 'ID');
        data.issueDate = formatDate(getVal(root, 'IssueDate'));
        data.dueDate = formatDate(getVal(root, 'DueDate'));
        data.taxPointDate = formatDate(getVal(root, 'TaxPointDate'));
        data.currency = getVal(root, 'DocumentCurrencyCode') || 'EUR';
        data.buyerRef = getVal(root, 'BuyerReference');

        const invPeriod = getChild(root, 'InvoicePeriod');
        if (invPeriod) {
            data.billingPeriodStart = formatDate(getVal(invPeriod, 'StartDate'));
            data.billingPeriodEnd = formatDate(getVal(invPeriod, 'EndDate'));
        }

        // Seller (AccountingSupplierParty)
        const supplier = getChild(getChild(root, 'AccountingSupplierParty'), 'Party');
        if (supplier) {
            const name = getVal(supplier, 'PartyLegalEntity', 'RegistrationName') || getVal(supplier, 'PartyName', 'Name');
            if (name) data.sellerLines.push({ text: name, bold: true });
            const addr = getChild(supplier, 'PostalAddress');
            if (addr) {
                const l1 = getVal(addr, 'StreetName');
                const l2 = getVal(addr, 'AdditionalStreetName');
                const zip = getVal(addr, 'PostalZone');
                const city = getVal(addr, 'CityName');
                if (l1) data.sellerLines.push({ text: l1 });
                if (l2) data.sellerLines.push({ text: l2 });
                if (zip || city) data.sellerLines.push({ text: `${zip} ${city}`.trim() });
            }
            const taxScheme = getChild(supplier, 'PartyTaxScheme');
            if (taxScheme) {
                const compId = getVal(taxScheme, 'CompanyID');
                if (compId) data.sellerLines.push({ text: `USt-IdNr.: ${compId}` });
            }
            const contact = getChild(supplier, 'Contact');
            if (contact) {
                const cName = getVal(contact, 'Name');
                const tel = getVal(contact, 'Telephone');
                const mail = getVal(contact, 'ElectronicMail');
                if (cName) data.sellerLines.push({ text: cName });
                if (tel) data.sellerLines.push({ text: tel });
                if (mail) data.sellerLines.push({ text: mail });
            }
        }

        // Buyer (AccountingCustomerParty)
        const customer = getChild(getChild(root, 'AccountingCustomerParty'), 'Party');
        if (customer) {
            const name = getVal(customer, 'PartyLegalEntity', 'RegistrationName') || getVal(customer, 'PartyName', 'Name');
            if (name) data.buyerLines.push({ text: name, bold: true });
            const addr = getChild(customer, 'PostalAddress');
            if (addr) {
                const l1 = getVal(addr, 'StreetName');
                const l2 = getVal(addr, 'AdditionalStreetName');
                const zip = getVal(addr, 'PostalZone');
                const city = getVal(addr, 'CityName');
                if (l1) data.buyerLines.push({ text: l1 });
                if (l2) data.buyerLines.push({ text: l2 });
                if (zip || city) data.buyerLines.push({ text: `${zip} ${city}`.trim() });
            }
            const taxScheme = getChild(customer, 'PartyTaxScheme');
            if (taxScheme) {
                const compId = getVal(taxScheme, 'CompanyID');
                if (compId) data.buyerLines.push({ text: compId });
            }
        }

        // Delivery
        const deliv = getChild(root, 'Delivery');
        if (deliv) {
            const delivLoc = getChild(deliv, 'DeliveryLocation');
            const delivParty = getChild(deliv, 'DeliveryParty');
            const pName = getVal(delivParty, 'PartyName', 'Name');
            if (pName) data.shipToLines.push({ text: pName });
            const addr = getChild(delivLoc, 'Address');
            if (addr) {
                const l1 = getVal(addr, 'StreetName');
                const l2 = getVal(addr, 'AdditionalStreetName');
                const zip = getVal(addr, 'PostalZone');
                const city = getVal(addr, 'CityName');
                const country = getVal(addr, 'Country', 'IdentificationCode');
                if (l1) data.shipToLines.push({ text: l1 });
                if (l2) data.shipToLines.push({ text: l2 });
                if (zip) data.shipToLines.push({ text: zip });
                if (city) data.shipToLines.push({ text: city });
                if (country) data.shipToLines.push({ text: countryNames[country] || country });
            }
        }

        // Taxes & Totals
        const taxTotal = getChild(root, 'TaxTotal');
        if (taxTotal) {
            const subtotals = getChildren(taxTotal, 'TaxSubtotal');
            subtotals.forEach(st => {
                data.taxes.push({
                    type: getVal(st, 'TaxCategory', 'TaxScheme', 'ID') || 'VAT',
                    rate: getVal(st, 'TaxCategory', 'Percent'),
                    basis: getVal(st, 'TaxableAmount'),
                    amount: getVal(st, 'TaxAmount')
                });
            });
        }

        const monetary = getChild(root, 'LegalMonetaryTotal');
        if (monetary) {
            data.subtotal = getVal(monetary, 'TaxExclusiveAmount') || getVal(monetary, 'LineExtensionAmount');
            data.grandTotal = getVal(monetary, 'TaxInclusiveAmount');
            data.duePayable = getVal(monetary, 'PayableAmount');
        }

        const payTerms = getChild(root, 'PaymentTerms');
        if (payTerms) {
            data.paymentTerms = getVal(payTerms, 'Note');
        }

        const payMeans = getChild(root, 'PaymentMeans');
        if (payMeans) {
            data.iban = getVal(payMeans, 'PayeeFinancialAccount', 'ID');
            data.bic = getVal(payMeans, 'PayeeFinancialAccount', 'FinancialInstitutionBranch', 'ID');
        }

        const lines = getChildren(root, 'InvoiceLine').concat(getChildren(root, 'CreditNoteLine'));
        lines.forEach(li => {
            const item = getChild(li, 'Item');
            const price = getChild(li, 'Price');
            data.items.push({
                name: getVal(item, 'Name') || getVal(item, 'Description'),
                qty: getVal(li, 'InvoicedQuantity') || getVal(li, 'CreditedQuantity'),
                unitPrice: getVal(price, 'PriceAmount'),
                total: getVal(li, 'LineExtensionAmount')
            });
        });
    }

    // Meta-Zeilen oben rechts
    const metaRows = [];
    if (data.invoiceId) metaRows.push({ label: 'Rechnungsnummer', val: data.invoiceId });
    if (data.issueDate) metaRows.push({ label: 'Datum', val: data.issueDate });
    if (data.dueDate) metaRows.push({ label: 'Fälligkeitsdatum', val: data.dueDate });
    if (data.taxPointDate) metaRows.push({ label: 'Datum der Steuerfälligkeit', val: data.taxPointDate });
    if (data.billingPeriodStart && data.billingPeriodEnd) {
        metaRows.push({ label: 'Rechnungszeitraum', val: `${data.billingPeriodStart} - ${data.billingPeriodEnd}` });
    } else if (data.billingPeriodEnd) {
        metaRows.push({ label: 'Enddatum des Rechnungszeitraums', val: data.billingPeriodEnd });
    }
    if (data.buyerRef) metaRows.push({ label: 'Käuferreferenz', val: data.buyerRef });
    if (data.orderRef) metaRows.push({ label: 'Bestellnummer', val: data.orderRef });

    const renderAddressLines = (lines) => lines.map(l =>
        `<div style="${l.bold ? 'font-weight: 700; color: #1b2e3c; margin-bottom: 2px;' : ''}">${esc(l.text)}</div>`
    ).join('');

    const htmlDoc = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>${esc(data.docTitle)} ${esc(data.invoiceId)}</title>
<style>
    * { box-sizing: border-box; }
    body {
        margin: 0;
        padding: 24px;
        background-color: #eef2f6;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
        color: #243b4a;
        font-size: 13px;
        line-height: 1.5;
        display: flex;
        justify-content: center;
    }
    .page {
        background: #ffffff;
        width: 100%;
        max-width: 860px;
        min-height: 1050px;
        padding: 52px 56px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        border-radius: 2px;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
    .watermark {
        position: absolute;
        top: 46%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-52deg);
        font-size: 135px;
        font-weight: 700;
        color: rgba(226, 232, 240, 0.45);
        pointer-events: none;
        user-select: none;
        z-index: 0;
        letter-spacing: 2px;
    }
    .content {
        position: relative;
        z-index: 1;
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    .top-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 32px;
        margin-bottom: 42px;
    }
    .seller-block {
        font-size: 13px;
        line-height: 1.55;
        color: #243b4a;
    }
    .doc-header-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        min-width: 340px;
    }
    .doc-title {
        font-size: 32px;
        font-weight: 700;
        color: #0f293a;
        margin: 0 0 16px 0;
        letter-spacing: -0.3px;
    }
    .meta-box {
        background-color: #f4f6fb;
        padding: 16px 20px;
        border-radius: 2px;
        width: 100%;
    }
    .meta-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12.5px;
    }
    .meta-table td {
        padding: 3.5px 0;
    }
    .meta-table td.label {
        font-weight: 700;
        color: #1b2e3c;
        padding-right: 20px;
    }
    .meta-table td.val {
        text-align: right;
        color: #243b4a;
        white-space: nowrap;
    }
    .parties-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 24px;
        margin-bottom: 48px;
        font-size: 13px;
        line-height: 1.55;
    }
    .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 28px;
        font-size: 13px;
    }
    .items-table th {
        text-align: left;
        font-weight: 700;
        color: #1b2e3c;
        padding: 10px 8px;
        border-bottom: 1.5px solid #cbd5e1;
    }
    .items-table th.num, .items-table td.num {
        text-align: right;
    }
    .items-table td {
        padding: 12px 8px;
        border-bottom: 1px solid #e2e8f0;
        color: #334e68;
    }
    .totals-section {
        width: 100%;
        margin-bottom: 48px;
    }
    .totals-row {
        display: grid;
        grid-template-columns: 1fr 220px 160px;
        padding: 9px 12px;
        font-size: 13px;
        align-items: center;
    }
    .totals-row.shaded {
        background-color: #f4f6fb;
        font-weight: 700;
        color: #1b2e3c;
    }
    .totals-row .t-label {
        grid-column: 2;
        text-align: right;
        padding-right: 16px;
    }
    .totals-row .t-val {
        grid-column: 3;
        text-align: right;
    }
    .footer-section {
        margin-top: auto;
        padding-top: 24px;
        font-size: 13px;
        line-height: 1.6;
    }
    .footer-title {
        font-weight: 700;
        color: #1b2e3c;
        margin-bottom: 2px;
    }
    @media print {
        body {
            background: #ffffff;
            padding: 0;
        }
        .page {
            box-shadow: none;
            max-width: 100%;
            min-height: auto;
            padding: 20px;
        }
    }
</style>
</head>
<body>
    <div class="page">
        <div class="watermark">Kopie</div>
        <div class="content">
            <div class="top-row">
                <div class="seller-block">
                    ${renderAddressLines(data.sellerLines)}
                </div>
                <div class="doc-header-right">
                    <h1 class="doc-title">${esc(data.docTitle)}</h1>
                    <div class="meta-box">
                        <table class="meta-table">
                            ${metaRows.map(r => `
                                <tr>
                                    <td class="label">${esc(r.label)}</td>
                                    <td class="val">${esc(r.val)}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                </div>
            </div>

            <div class="parties-row">
                <div>
                    ${renderAddressLines(data.buyerLines)}
                </div>
                <div>
                    ${data.shipToLines.length > 0 ? `
                        <div style="font-weight: 700; color: #1b2e3c; margin-bottom: 2px;">Informationen zur Lieferung</div>
                        ${renderAddressLines(data.shipToLines)}
                    ` : ''}
                </div>
                <div></div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 46%;">Produkt oder Dienstleistung</th>
                        <th class="num" style="width: 14%;">Menge</th>
                        <th class="num" style="width: 20%;">Einzelpreis</th>
                        <th class="num" style="width: 20%;">Gesamtbetrag</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map(item => `
                        <tr>
                            <td>${esc(item.name)}</td>
                            <td class="num">${esc(formatQty(item.qty))}</td>
                            <td class="num">${esc(formatAmount(item.unitPrice, data.currency))}</td>
                            <td class="num">${esc(formatAmount(item.total, data.currency))}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="totals-section">
                <div class="totals-row shaded">
                    <div class="t-label">Zwischensumme</div>
                    <div class="t-val">${esc(formatAmount(data.subtotal, data.currency))}</div>
                </div>
                ${data.taxes.map(t => `
                    <div class="totals-row">
                        <div class="t-label">${esc(t.type)} ${esc(formatPercent(t.rate))}</div>
                        <div class="t-val">${esc(formatAmount(t.amount, data.currency))}</div>
                    </div>
                `).join('')}
                <div class="totals-row shaded">
                    <div class="t-label">Gesamtbetrag</div>
                    <div class="t-val">${esc(formatAmount(data.grandTotal || data.duePayable, data.currency))}</div>
                </div>
            </div>

            ${(data.paymentTerms || data.iban || data.notes.length > 0) ? `
                <div class="footer-section">
                    ${(data.paymentTerms || data.iban) ? `
                        <div class="footer-title">Zahlung</div>
                        ${data.paymentTerms ? `<div>Zahlungsbedingungen: ${esc(data.paymentTerms)}</div>` : ''}
                        ${data.iban ? `<div>IBAN: ${esc(data.iban)}${data.bic ? ` &nbsp;|&nbsp; BIC: ${esc(data.bic)}` : ''}</div>` : ''}
                    ` : ''}
                    ${data.notes.length > 0 ? `
                        <div class="footer-title" style="margin-top: 12px;">Hinweise</div>
                        ${data.notes.map(n => `<div>${esc(n)}</div>`).join('')}
                    ` : ''}
                </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'flex: 1; width: 100%; border: none; background: #eef2f6;';
    iframe.srcdoc = htmlDoc;

    // XML-Code Ansicht (Punkt 5: Rohdaten-Umschalter mit Zeilennummern & Kopierfunktion)
    const prettyXml = formatPrettyXml(xmlText);
    const xmlLines = prettyXml.split('\n');
    const codeContainer = document.createElement('div');
    codeContainer.style.cssText = 'flex: 1; width: 100%; display: none; flex-direction: column; background: #ffffff; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';

    const codeHeader = document.createElement('div');
    codeHeader.style.cssText = 'padding: 8px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748b; flex-shrink: 0;';
    codeHeader.innerHTML = `
        <span>XML-Quelltext (${xmlLines.length} Zeilen)</span>
        <div style="display: flex; gap: 8px; align-items: center;">
            <input type="text" id="xml-search-input" placeholder="Im XML suchen..." style="padding: 4px 8px; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 4px; outline: none; width: 180px; color: #0f172a;">
            <button id="copy-xml-raw-btn" style="padding: 4px 10px; font-size: 11px; font-weight: 500; cursor: pointer; background: #ffffff; color: #334155; border: 1px solid #cbd5e1; border-radius: 4px;">
                XML kopieren
            </button>
        </div>
    `;

    const codeScroll = document.createElement('div');
    codeScroll.style.cssText = 'flex: 1; overflow: auto; padding: 12px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; line-height: 1.55; color: #1e293b;';

    const renderXmlLines = (filterStr = '') => {
        const lowerFilter = filterStr.toLowerCase();
        codeScroll.innerHTML = xmlLines.map((line, idx) => {
            const isMatch = lowerFilter && line.toLowerCase().includes(lowerFilter);
            const rowBg = isMatch ? 'background: #fef9c3;' : '';
            // Dezentes Syntax-Coloring für XML-Tags
            const highlighted = esc(line)
                .replace(/(&lt;\/?[\w:-]+)/g, '<span style="color:#0369a1;font-weight:500;">$1</span>')
                .replace(/(\/?&gt;)/g, '<span style="color:#0369a1;font-weight:500;">$1</span>')
                .replace(/([\w:-]+)=(&quot;[^&]*&quot;)/g, '<span style="color:#0f766e;">$1</span>=<span style="color:#b45309;">$2</span>');
            return `<div style="display: flex; padding: 0 16px; ${rowBg}">
                <span style="width: 44px; flex-shrink: 0; color: #94a3b8; user-select: none; text-align: right; padding-right: 14px; font-size: 11px;">${idx + 1}</span>
                <span style="white-space: pre; flex: 1;">${highlighted}</span>
            </div>`;
        }).join('');
    };
    renderXmlLines();

    codeContainer.appendChild(codeHeader);
    codeContainer.appendChild(codeScroll);

    const searchInput = codeHeader.querySelector('#xml-search-input');
    searchInput.addEventListener('input', (e) => renderXmlLines(e.target.value));

    const copyBtn = codeHeader.querySelector('#copy-xml-raw-btn');
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(prettyXml).then(() => {
            const orig = copyBtn.textContent;
            copyBtn.textContent = 'Kopiert';
            setTimeout(() => { copyBtn.textContent = orig; }, 1500);
        });
    };

    // Falls hideFooter gesetzt ist (z.B. im hybriden PDF+ZUGFeRD-Viewer, der eine eigene Hauptleiste besitzt),
    // geben wir die Steuerfunktionen nach außen oder zeigen die Standard-Fußleiste
    if (!options.hideFooter) {
        const footer = document.createElement('div');
        footer.style.cssText = 'padding: 10px 16px; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; color: #64748b; flex-shrink: 0;';
        footer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="display: inline-flex; background: #f1f5f9; padding: 2px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <button id="tab-view-visual" style="padding: 4px 10px; font-size: 11px; font-weight: 600; border: none; border-radius: 4px; cursor: pointer; background: #ffffff; color: #0f172a; box-shadow: 0 1px 2px rgba(0,0,0,0.06);">
                        Vorschau
                    </button>
                    <button id="tab-view-xml" style="padding: 4px 10px; font-size: 11px; font-weight: 500; border: none; border-radius: 4px; cursor: pointer; background: transparent; color: #64748b;">
                        XML-Code
                    </button>
                </div>
                <span style="color: #cbd5e1;">|</span>
                <span>Rechnung <strong style="color: #0f172a; font-weight: 600;">${esc(data.invoiceId || '-')}</strong></span>
            </div>
            <div style="display: flex; gap: 8px;">
                <button id="zugferd-print-btn" style="padding: 6px 12px; font-size: 12px; font-weight: 500; cursor: pointer; background: #ffffff; color: #334155; border: 1px solid #cbd5e1; border-radius: 5px; transition: all 0.15s;">
                    Als PDF speichern
                </button>
                <button id="zugferd-dl-btn" style="padding: 6px 12px; font-size: 12px; font-weight: 500; cursor: pointer; background: #0f172a; color: #ffffff; border: 1px solid #0f172a; border-radius: 5px; transition: all 0.15s;">
                    XML herunterladen
                </button>
            </div>
        `;

        viewer.appendChild(iframe);
        viewer.appendChild(codeContainer);
        viewer.appendChild(footer);
        parent.appendChild(viewer);

        const btnVisual = footer.querySelector('#tab-view-visual');
        const btnXml = footer.querySelector('#tab-view-xml');

        btnVisual.onclick = () => {
            iframe.style.display = 'block';
            codeContainer.style.display = 'none';
            btnVisual.style.background = '#ffffff';
            btnVisual.style.color = '#0f172a';
            btnVisual.style.fontWeight = '600';
            btnVisual.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)';
            btnXml.style.background = 'transparent';
            btnXml.style.color = '#64748b';
            btnXml.style.fontWeight = '500';
            btnXml.style.boxShadow = 'none';
        };

        btnXml.onclick = () => {
            iframe.style.display = 'none';
            codeContainer.style.display = 'flex';
            btnXml.style.background = '#ffffff';
            btnXml.style.color = '#0f172a';
            btnXml.style.fontWeight = '600';
            btnXml.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)';
            btnVisual.style.background = 'transparent';
            btnVisual.style.color = '#64748b';
            btnVisual.style.fontWeight = '500';
            btnVisual.style.boxShadow = 'none';
        };

        footer.querySelector('#zugferd-print-btn').onclick = () => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            }
        };

        const dlBtn = footer.querySelector('#zugferd-dl-btn');
        if (fileUrl) {
            dlBtn.onclick = () => {
                const absoluteUrl = new URL(fileUrl, window.location.origin).href;
                chrome.runtime.sendMessage({ action: 'downloadFile', url: absoluteUrl });
            };
        } else {
            dlBtn.onclick = () => {
                const blob = new Blob([xmlText], { type: 'application/xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `factur-x-${data.invoiceId || 'invoice'}.xml`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 2000);
            };
        }
    } else {
        // Im eingebetteten Modus (z.B. für Umschalter in hybrider PDF)
        if (options.initialMode === 'xml') {
            iframe.style.display = 'none';
            codeContainer.style.display = 'flex';
        }
        viewer.appendChild(iframe);
        viewer.appendChild(codeContainer);
        parent.appendChild(viewer);
    }

    return {
        data,
        setMode: (mode) => {
            if (mode === 'xml') {
                iframe.style.display = 'none';
                codeContainer.style.display = 'flex';
            } else {
                iframe.style.display = 'block';
                codeContainer.style.display = 'none';
            }
        },
        printVisual: () => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            }
        }
    };
}

// ============================================================================
// ZUGFeRD / E-Rechnung Checker & PDF-XML-Extractor (EN 16931 / BR-DE)
// ============================================================================

async function extractXmlFromPdfBytes(uint8Array) {
    const latin1 = new TextDecoder('latin1').decode(uint8Array);

    // 1. Versuch: Falls der Stream unkomprimiert im PDF liegt
    const startTags = ['<rsm:CrossIndustryInvoice', '<CrossIndustryInvoice', '<ubl:Invoice', '<Invoice', '<ubl:CreditNote', '<CreditNote'];
    const endTags = ['</rsm:CrossIndustryInvoice>', '</CrossIndustryInvoice>', '</ubl:Invoice>', '</Invoice>', '</ubl:CreditNote>', '</CreditNote>'];

    for (let i = 0; i < startTags.length; i++) {
        const sIdx = latin1.indexOf(startTags[i]);
        if (sIdx !== -1) {
            const eIdx = latin1.indexOf(endTags[i], sIdx);
            if (eIdx !== -1) {
                let realStart = sIdx;
                const xmlDecl = latin1.lastIndexOf('<?xml', sIdx);
                if (xmlDecl !== -1 && (sIdx - xmlDecl) < 250) realStart = xmlDecl;
                const subBytes = uint8Array.slice(realStart, eIdx + endTags[i].length);
                return new TextDecoder('utf-8').decode(subBytes);
            }
        }
    }

    // 2. Versuch: FlateDecode-komprimierte PDF-Streams durchsuchen (Standard bei ZUGFeRD PDF/A-3)
    if (typeof DecompressionStream === 'undefined') return null;

    const tryDecompress = async (bytes, format) => {
        try {
            const ds = new DecompressionStream(format);
            const writer = ds.writable.getWriter();
            writer.write(bytes).catch(() => {});
            writer.close().catch(() => {});
            const response = new Response(ds.readable);
            const buf = await response.arrayBuffer();
            return new TextDecoder('utf-8').decode(buf);
        } catch (e) {
            return null;
        }
    };

    let searchPos = 0;
    while (searchPos < latin1.length) {
        const streamIdx = latin1.indexOf('stream', searchPos);
        if (streamIdx === -1) break;

        // Sicherstellen, dass es nicht "endstream" ist
        if (streamIdx >= 3 && latin1.substring(streamIdx - 3, streamIdx) === 'end') {
            searchPos = streamIdx + 6;
            continue;
        }

        let dataStart = streamIdx + 6;
        if (latin1[dataStart] === '\r' && latin1[dataStart + 1] === '\n') dataStart += 2;
        else if (latin1[dataStart] === '\n' || latin1[dataStart] === '\r') dataStart += 1;
        else {
            searchPos = streamIdx + 6;
            continue;
        }

        const endStreamIdx = latin1.indexOf('endstream', dataStart);
        if (endStreamIdx === -1) break;

        // Prüfe das Dictionary vor dem Stream
        const dictCheck = latin1.substring(Math.max(0, streamIdx - 350), streamIdx);
        const isCandidate = dictCheck.includes('EmbeddedFile') || dictCheck.includes('xml') || dictCheck.includes('FlateDecode');

        let dataEnd = endStreamIdx;
        if (latin1[dataEnd - 1] === '\n') dataEnd--;
        if (latin1[dataEnd - 1] === '\r') dataEnd--;

        const streamLen = dataEnd - dataStart;
        if (isCandidate && streamLen > 50 && streamLen < 5 * 1024 * 1024) {
            const rawSlice = uint8Array.slice(dataStart, dataEnd);
            let text = await tryDecompress(rawSlice, 'deflate');
            if (!text) text = await tryDecompress(rawSlice, 'deflate-raw');

            if (text && (text.includes('CrossIndustryInvoice') || text.includes(':Invoice') || text.includes('<Invoice') || text.includes('CreditNote'))) {
                return text.trim();
            }
        }

        searchPos = endStreamIdx + 9;
    }

    return null;
}

function validateZugferdXml(xmlText) {
    const results = {
        isValid: false,
        format: 'Unbekannt',
        profile: 'Nicht angegeben',
        checks: []
    };

    const addCheck = (id, title, status, detail) => {
        results.checks.push({ id, title, status, detail }); // status: 'pass' | 'warn' | 'fail'
    };

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const parseError = xmlDoc.getElementsByTagName('parsererror');

    if (parseError.length > 0) {
        addCheck('XML-SYNTAX', 'XML Wohlgeformtheit', 'fail', 'Die Datei ist kein gültiges XML-Dokument.');
        return results;
    }
    addCheck('XML-SYNTAX', 'XML Wohlgeformtheit', 'pass', 'XML-Struktur ist technisch fehlerfrei lesbar.');

    const getChild = (el, localName) => {
        if (!el || !el.children) return null;
        for (let i = 0; i < el.children.length; i++) {
            const c = el.children[i];
            if (c.localName === localName || c.nodeName.endsWith(':' + localName) || c.nodeName === localName) return c;
        }
        return null;
    };
    const getChildren = (el, localName) => {
        const res = [];
        if (!el || !el.children) return res;
        for (let i = 0; i < el.children.length; i++) {
            const c = el.children[i];
            if (c.localName === localName || c.nodeName.endsWith(':' + localName) || c.nodeName === localName) res.push(c);
        }
        return res;
    };
    const getVal = (el, ...path) => {
        let cur = el;
        for (const p of path) {
            cur = getChild(cur, p);
            if (!cur) return '';
        }
        return cur.textContent ? cur.textContent.trim() : '';
    };

    const root = xmlDoc.documentElement;
    const rootName = root ? root.localName : '';
    const isCII = rootName === 'CrossIndustryInvoice' || xmlText.includes('CrossIndustryInvoice');
    const isUBL = rootName === 'Invoice' || rootName === 'CreditNote' || xmlText.includes('urn:oasis:names:specification:ubl');

    if (!isCII && !isUBL) {
        addCheck('SCHEMA', 'E-Rechnung Standard (CII / UBL)', 'fail', `Unbekanntes Root-Element <${rootName}>. Weder UN/CEFACT CII noch UBL erkannt.`);
        return results;
    }

    if (isCII) {
        results.format = 'UN/CEFACT CII (ZUGFeRD / Factur-X)';
        const ctx = getChild(root, 'ExchangedDocumentContext');
        const profileId = getVal(ctx, 'GuidelineSpecifiedDocumentContextParameter', 'ID');
        results.profile = profileId || 'Kein Profil-Tag gefunden';

        if (profileId) {
            addCheck('BR-01', 'Prozess-/Profilkennung (BT-24)', 'pass', profileId);
        } else {
            addCheck('BR-01', 'Prozess-/Profilkennung (BT-24)', 'fail', 'GuidelineSpecifiedDocumentContextParameter/ID fehlt.');
        }

        const exchDoc = getChild(root, 'ExchangedDocument');
        const invId = getVal(exchDoc, 'ID');
        const typeCode = getVal(exchDoc, 'TypeCode');
        const issueDate = getVal(exchDoc, 'IssueDateTime', 'DateTimeString') || getVal(exchDoc, 'IssueDateTime');

        addCheck('BR-02', 'Rechnungsnummer (BT-1)', invId ? 'pass' : 'fail', invId ? `Vorhanden: ${invId}` : 'Rechnungsnummer fehlt!');
        addCheck('BR-03', 'Rechnungsdatum (BT-2)', issueDate ? 'pass' : 'fail', issueDate ? `Vorhanden: ${issueDate}` : 'Ausstellungsdatum fehlt!');
        addCheck('BR-04', 'Rechnungsart-Code (BT-3)', typeCode ? 'pass' : 'fail', typeCode ? `TypeCode: ${typeCode}` : 'TypeCode fehlt!');

        const trans = getChild(root, 'SupplyChainTradeTransaction');
        const agree = getChild(trans, 'ApplicableHeaderTradeAgreement');
        const settle = getChild(trans, 'ApplicableHeaderTradeSettlement');

        const seller = getChild(agree, 'SellerTradeParty');
        const sellerName = getVal(seller, 'Name');
        const sellerAddr = getChild(seller, 'PostalTradeAddress');
        const sellerCountry = getVal(sellerAddr, 'CountryID');
        const sellerZip = getVal(sellerAddr, 'PostcodeCode');
        const sellerCity = getVal(sellerAddr, 'CityName');

        addCheck('BR-06', 'Verkäufername (BT-27)', sellerName ? 'pass' : 'fail', sellerName || 'Name des Verkäufers fehlt!');
        addCheck('BR-08', 'Verkäufer-Anschrift & Land (BG-5)', (sellerCountry && sellerCity && sellerZip) ? 'pass' : 'warn',
            `PLZ: ${sellerZip || '-'}, Ort: ${sellerCity || '-'}, Land: ${sellerCountry || '-'}`);

        const taxRegs = getChildren(seller, 'SpecifiedTaxRegistration');
        const taxIds = taxRegs.map(tr => getVal(tr, 'ID')).filter(Boolean);
        addCheck('BR-CO-26', 'Steuernummer / USt-IdNr. Verkäufer (BT-31/32)', taxIds.length > 0 ? 'pass' : 'fail',
            taxIds.length > 0 ? taxIds.join(', ') : 'Weder USt-IdNr. noch Steuernummer angegeben!');

        const contact = getChild(seller, 'DefinedTradeContact');
        const hasContact = contact && (getVal(contact, 'PersonName') || getVal(contact, 'DepartmentName')) &&
            (getVal(contact, 'TelephoneUniversalCommunication', 'CompleteNumber') || getVal(contact, 'EmailURIUniversalCommunication', 'URIID'));
        addCheck('BR-DE-2', 'Verkäufer-Kontakt (XRechnung BR-DE-2)', hasContact ? 'pass' : 'warn',
            hasContact ? 'Ansprechpartner & Telefon/E-Mail vorhanden' : 'Optional bei ZUGFeRD Basic/EN16931, Pflicht bei XRechnung');

        const buyer = getChild(agree, 'BuyerTradeParty');
        const buyerName = getVal(buyer, 'Name');
        const buyerAddr = getChild(buyer, 'PostalTradeAddress');
        const buyerCountry = getVal(buyerAddr, 'CountryID');
        addCheck('BR-07', 'Käufername & Land (BT-44 / BT-55)', (buyerName && buyerCountry) ? 'pass' : 'fail',
            buyerName ? `${buyerName} (${buyerCountry || 'Kein Land'})` : 'Käuferangaben unvollständig!');

        const buyerRef = getVal(agree, 'BuyerReference');
        addCheck('BR-DE-15', 'Käuferreferenz / Leitweg-ID (BT-10)', buyerRef ? 'pass' : 'warn',
            buyerRef ? `Vorhanden: ${buyerRef}` : 'Nicht gefüllt (Pflicht bei XRechnung / B2G, optional im B2B)');

        const currency = getVal(settle, 'InvoiceCurrencyCode');
        addCheck('BR-05', 'Währungscode (BT-5)', currency ? 'pass' : 'fail', currency || 'Währungscode fehlt!');

        const lines = getChildren(trans, 'IncludedSupplyChainTradeLineItem');
        addCheck('BR-16', 'Rechnungspositionen (BG-25)', lines.length > 0 ? 'pass' : 'fail',
            lines.length > 0 ? `${lines.length} Position(en) gefunden` : 'Mindestens eine Position ist gesetzlich vorgeschrieben!');

        // Mathematische Prüfung nach EN 16931
        const sum = getChild(settle, 'SpecifiedTradeSettlementHeaderMonetarySummation');
        const lineTotal = parseFloat(getVal(sum, 'LineTotalAmount') || '0');
        const taxBasis = parseFloat(getVal(sum, 'TaxBasisTotalAmount') || '0');
        const taxTotal = parseFloat(getVal(sum, 'TaxTotalAmount') || '0');
        const grandTotal = parseFloat(getVal(sum, 'GrandTotalAmount') || '0');
        const duePayable = parseFloat(getVal(sum, 'DuePayableAmount') || '0');

        let calcLinesSum = 0;
        lines.forEach(li => {
            const lt = parseFloat(getVal(li, 'SpecifiedLineTradeSettlement', 'SpecifiedTradeSettlementLineMonetarySummation', 'LineTotalAmount') || '0');
            if (!isNaN(lt)) calcLinesSum += lt;
        });

        const diffLines = Math.abs(calcLinesSum - lineTotal);
        addCheck('BR-CO-10', 'Summe der Positionen = Netto-Gesamtbetrag (BT-106)', diffLines <= 0.02 ? 'pass' : 'fail',
            `Berechnet: ${calcLinesSum.toFixed(2)} ${currency} | Im XML: ${lineTotal.toFixed(2)} ${currency}`);

        const expectedGrand = taxBasis + taxTotal;
        const diffGrand = Math.abs(expectedGrand - grandTotal);
        addCheck('BR-CO-15', 'Bruttobetrag = Steuerbasis + MwSt (BT-112)', diffGrand <= 0.02 ? 'pass' : 'fail',
            `${taxBasis.toFixed(2)} + ${taxTotal.toFixed(2)} = ${expectedGrand.toFixed(2)} ${currency} (XML: ${grandTotal.toFixed(2)} ${currency})`);

        addCheck('BR-CO-16', 'Fälliger Zahlbetrag (BT-115)', !isNaN(duePayable) && getVal(sum, 'DuePayableAmount') !== '' ? 'pass' : 'fail',
            `${duePayable.toFixed(2)} ${currency}`);
    } else if (isUBL) {
        results.format = 'OASIS UBL 2.1 (XRechnung / ZUGFeRD UBL)';
        const profileId = getVal(root, 'ProfileID') || getVal(root, 'CustomizationID');
        results.profile = profileId || 'Standard UBL';

        addCheck('BR-01', 'Prozess-/Spezifikationskennung', profileId ? 'pass' : 'warn', profileId || 'Keine CustomizationID/ProfileID gefunden');
        const invId = getVal(root, 'ID');
        const issueDate = getVal(root, 'IssueDate');
        const currency = getVal(root, 'DocumentCurrencyCode');

        addCheck('BR-02', 'Rechnungsnummer (BT-1)', invId ? 'pass' : 'fail', invId || 'Fehlt!');
        addCheck('BR-03', 'Rechnungsdatum (BT-2)', issueDate ? 'pass' : 'fail', issueDate || 'Fehlt!');
        addCheck('BR-05', 'Währungscode (BT-5)', currency ? 'pass' : 'fail', currency || 'Fehlt!');

        const supplier = getChild(getChild(root, 'AccountingSupplierParty'), 'Party');
        const sellerName = getVal(supplier, 'PartyLegalEntity', 'RegistrationName') || getVal(supplier, 'PartyName', 'Name');
        addCheck('BR-06', 'Verkäufername (BT-27)', sellerName ? 'pass' : 'fail', sellerName || 'Fehlt!');

        const customer = getChild(getChild(root, 'AccountingCustomerParty'), 'Party');
        const buyerName = getVal(customer, 'PartyLegalEntity', 'RegistrationName') || getVal(customer, 'PartyName', 'Name');
        addCheck('BR-07', 'Käufername (BT-44)', buyerName ? 'pass' : 'fail', buyerName || 'Fehlt!');

        const lines = getChildren(root, 'InvoiceLine').concat(getChildren(root, 'CreditNoteLine'));
        addCheck('BR-16', 'Rechnungspositionen (BG-25)', lines.length > 0 ? 'pass' : 'fail', `${lines.length} Position(en)`);

        const monetary = getChild(root, 'LegalMonetaryTotal');
        const taxExcl = parseFloat(getVal(monetary, 'TaxExclusiveAmount') || '0');
        const taxIncl = parseFloat(getVal(monetary, 'TaxInclusiveAmount') || '0');
        const taxAmt = parseFloat(getVal(root, 'TaxTotal', 'TaxAmount') || '0');
        const diffGrand = Math.abs((taxExcl + taxAmt) - taxIncl);

        addCheck('BR-CO-15', 'Bruttobetrag = Netto + Steuer (BT-112)', diffGrand <= 0.02 ? 'pass' : 'fail',
            `${taxExcl.toFixed(2)} + ${taxAmt.toFixed(2)} = ${(taxExcl + taxAmt).toFixed(2)} (XML: ${taxIncl.toFixed(2)})`);
    }

    results.isValid = !results.checks.some(c => c.status === 'fail');
    return results;
}

function showZugferdCheckerOverlay() {
    if (window !== window.top) return;

    // Stelle sicher, dass das Haupt-Overlay existiert
    let container = document.getElementById('pdf-container');
    if (!container) {
        // Baue das Container-Gerüst auf (auch wenn kein Infor-Dokument geöffnet ist)
        let savedWidth = localStorage.getItem('pdfWidth') || '55%';
        container = document.createElement('div');
        container.id = 'pdf-container';
        container.style.cssText = `
            position: fixed; top: 0; right: 0; height: 100%; width: ${savedWidth};
            z-index: 9999; display: flex; flex-direction: column; background: #fff;
            box-shadow: 0 0 15px rgba(0,0,0,0.35); transition: width 0.25s ease;
        `;

        const contentArea = document.createElement('div');
        contentArea.id = 'overlay-content-area';
        contentArea.style.cssText = 'flex: 1; display: flex; justify-content: center; align-items: center; overflow: auto; position: relative;';

        const resizeHandle = document.createElement('div');
        resizeHandle.id = 'overlay-resize-handle';
        resizeHandle.style.cssText = `
            position: absolute; top: 0; left: -12px; width: 12px; height: 40px;
            background: #333; cursor: col-resize; display: flex; align-items: center;
            justify-content: center; border-radius: 4px 0 0 4px; z-index: 10000; user-select: none;
        `;
        resizeHandle.innerHTML = `<div style="display:flex;flex-direction:column;gap:4px;"><div style="width:3px;height:3px;background:rgba(255,255,255,0.4);border-radius:50%;"></div><div style="width:3px;height:3px;background:rgba(255,255,255,0.4);border-radius:50%;"></div><div style="width:3px;height:3px;background:rgba(255,255,255,0.4);border-radius:50%;"></div></div>`;

        let isResizing = false, startX, startWidth;
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true; startX = e.clientX; startWidth = container.offsetWidth;
            container.style.transition = 'none'; document.body.style.cursor = 'col-resize';
            const ifr = container.querySelector('iframe'); if (ifr) ifr.style.pointerEvents = 'none';
            e.preventDefault();
        });
        window.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newW = startWidth + (startX - e.clientX);
            if (newW > 300 && newW < window.innerWidth * 0.92) container.style.width = `${newW}px`;
        });
        window.addEventListener('mouseup', () => {
            if (!isResizing) return;
            isResizing = false; container.style.transition = 'width 0.25s ease'; document.body.style.cursor = '';
            const ifr = container.querySelector('iframe'); if (ifr) ifr.style.pointerEvents = 'auto';
            localStorage.setItem('pdfWidth', container.style.width);
        });

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; background: #000; color: #fff; border: none; padding: 6px 12px; cursor: pointer; font-size: 18px; border-radius: 4px; z-index: 10000;';
        closeBtn.addEventListener('click', () => container.remove());

        container.appendChild(contentArea);
        container.appendChild(resizeHandle);
        container.appendChild(closeBtn);
        document.body.appendChild(container);
    }

    const contentArea = container.querySelector('#overlay-content-area');
    contentArea.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width: 100%; height: 100%; display: flex; flex-direction: column; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a;';

    const topBar = document.createElement('div');
    topBar.style.cssText = 'padding: 14px 56px 14px 20px; background: #ffffff; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;';
    topBar.innerHTML = `
        <div>
            <div style="font-weight: 600; font-size: 14px; color: #0f172a; letter-spacing: -0.1px;">E-Rechnung Validator</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 1px;">EN 16931 / ZUGFeRD / XRechnung</div>
        </div>
        <button id="checker-new-file-btn" style="display: none; padding: 6px 12px; background: #ffffff; color: #334155; border: 1px solid #cbd5e1; border-radius: 5px; cursor: pointer; font-size: 12px; font-weight: 500; transition: background 0.15s;">
            Andere Datei wählen
        </button>
    `;

    const mainBody = document.createElement('div');
    mainBody.style.cssText = 'flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative;';

    const renderDropZone = () => {
        topBar.querySelector('#checker-new-file-btn').style.display = 'none';
        mainBody.innerHTML = `
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 32px;">
                <div id="zugferd-dropzone" style="
                    width: 100%; max-width: 480px; padding: 48px 32px;
                    border: 1px dashed #cbd5e1; border-radius: 8px;
                    background: #ffffff; text-align: center; cursor: pointer;
                    transition: border-color 0.15s ease, background 0.15s ease;
                ">
                    <div style="margin-bottom: 16px; color: #64748b; display: flex; justify-content: center;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="12" y1="18" x2="12" y2="12"></line>
                            <polyline points="9 15 12 12 15 15"></polyline>
                        </svg>
                    </div>
                    <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">
                        PDF- oder XML-Datei ablegen
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 20px; line-height: 1.5;">
                        Unterstützt ZUGFeRD / Factur-X (PDF/A-3 & XML) sowie XRechnung (CII / UBL)
                    </div>
                    <span style="display: inline-block; padding: 7px 14px; background: #0f172a; color: #ffffff; border-radius: 5px; font-weight: 500; font-size: 12px;">
                        Datei auswählen
                    </span>
                    <input type="file" id="zugferd-file-input" accept=".xml,.pdf,application/xml,text/xml,application/pdf" style="display: none;">
                </div>
            </div>
        `;

        const dz = mainBody.querySelector('#zugferd-dropzone');
        const fi = mainBody.querySelector('#zugferd-file-input');

        dz.onclick = () => fi.click();
        fi.onchange = (e) => {
            if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
        };

        dz.addEventListener('dragover', (e) => {
            e.preventDefault();
            dz.style.borderColor = '#0f172a';
            dz.style.background = '#f8fafc';
        });
        dz.addEventListener('dragleave', () => {
            dz.style.borderColor = '#cbd5e1';
            dz.style.background = '#ffffff';
        });
        dz.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    };

    const handleFile = async (file) => {
        topBar.querySelector('#checker-new-file-btn').style.display = 'inline-block';
        mainBody.innerHTML = `<div style="padding: 32px; text-align: center; color: #64748b; font-size: 13px;">Datei wird geprüft...</div>`;

        let xmlText = null;
        let isPdfSource = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

        if (isPdfSource) {
            const buf = await file.arrayBuffer();
            xmlText = await extractXmlFromPdfBytes(new Uint8Array(buf));
            if (!xmlText) {
                mainBody.innerHTML = `
                    <div style="padding: 24px;">
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 3px solid #dc2626; border-radius: 6px; padding: 16px 20px; color: #0f172a;">
                            <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">Keine eingebettete XML-Rechnung gefunden</div>
                            <div style="font-size: 12px; color: #64748b; line-height: 1.5;">
                                Die PDF-Datei <strong>${file.name}</strong> enthält keinen ZUGFeRD- oder Factur-X-Datensatz.
                            </div>
                        </div>
                    </div>
                `;
                return;
            }
        } else {
            xmlText = await file.text();
        }

        const report = validateZugferdXml(xmlText);
        const failCount = report.checks.filter(c => c.status === 'fail').length;
        const warnCount = report.checks.filter(c => c.status === 'warn').length;
        const passCount = report.checks.filter(c => c.status === 'pass').length;

        const accentColor = report.isValid ? '#16a34a' : '#dc2626';
        const badgeBg = report.isValid ? '#dcfce7' : '#fee2e2';
        const badgeText = report.isValid ? '#15803d' : '#b91c1c';
        const statusLabel = report.isValid ? 'Konform' : 'Fehlerhaft';

        mainBody.innerHTML = `
            <div style="padding: 12px 20px; background: #ffffff; border-bottom: 1px solid #e2e8f0; flex-shrink: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
                    <div style="min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${accentColor};"></span>
                            <span style="font-weight: 600; font-size: 13px; color: #0f172a;">${statusLabel}</span>
                            <span style="font-size: 12px; color: #64748b;">— ${report.format}</span>
                        </div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${file.name}${isPdfSource ? ' (PDF-Anhang)' : ''} &nbsp;·&nbsp; ${report.profile}
                        </div>
                    </div>
                    <button id="toggle-report-btn" style="padding: 5px 10px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; border-radius: 5px; cursor: pointer; font-size: 12px; font-weight: 500; white-space: nowrap; flex-shrink: 0;">
                        Prüfprotokoll (${passCount}/${report.checks.length})
                    </button>
                </div>
                <div id="validation-details-drawer" style="display: ${report.isValid ? 'none' : 'block'}; margin-top: 12px; max-height: 200px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 6px; background: #ffffff;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #334155;">
                        ${report.checks.map(c => {
                            const dotColor = c.status === 'pass' ? '#16a34a' : (c.status === 'warn' ? '#d97706' : '#dc2626');
                            const stText = c.status === 'pass' ? 'OK' : (c.status === 'warn' ? 'Hinweis' : 'Fehler');
                            return `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 6px 10px; white-space: nowrap; font-weight: 500; width: 70px;">
                                        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${dotColor};margin-right:6px;vertical-align:middle;"></span>${stText}
                                    </td>
                                    <td style="padding: 6px 8px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11px; color: #64748b; white-space: nowrap; width: 90px;">${c.id}</td>
                                    <td style="padding: 6px 8px; font-weight: 500; color: #0f172a; width: 32%;">${c.title}</td>
                                    <td style="padding: 6px 10px; color: #64748b;">${c.detail}</td>
                                </tr>
                            `;
                        }).join('')}
                    </table>
                </div>
            </div>
            <div id="checker-preview-area" style="flex: 1; display: flex; overflow: hidden; position: relative;"></div>
        `;

        const toggleBtn = mainBody.querySelector('#toggle-report-btn');
        const drawer = mainBody.querySelector('#validation-details-drawer');
        toggleBtn.onclick = () => {
            drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
        };

        const previewArea = mainBody.querySelector('#checker-preview-area');
        renderZugferdOverlay(previewArea, xmlText, null);
    };

    topBar.querySelector('#checker-new-file-btn').onclick = renderDropZone;

    // Erlaube auch jederzeit das Reinziehen einer weiteren Datei direkt ins offene Checker-Fenster
    wrapper.addEventListener('dragover', (e) => e.preventDefault());
    wrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    wrapper.appendChild(topBar);
    wrapper.appendChild(mainBody);
    contentArea.appendChild(wrapper);

    renderDropZone();
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
    } else if (mimetype === 'application/xml' || mimetype === 'text/xml') {
        const loader = document.createElement('div');
        loader.textContent = 'Lade E-Rechnung (XML)...';
        loader.style.cssText = 'padding: 20px; font-family: sans-serif; color: #555;';
        parent.appendChild(loader);

        const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : (window.location.origin + fileUrl);

        chrome.runtime.sendMessage({ action: 'fetchText', url: absoluteUrl, auth: authHeader }, (response) => {
            if (response && response.success) {
                renderZugferdOverlay(parent, response.text, fileUrl);
            } else {
                loader.textContent = 'Fehler beim Laden der XML-Datei: ' + (response ? response.error : 'Keine Antwort');
            }
        });
    } else {
        // Default (PDF oder SmallPreview Stream mit evtl. unbekanntem Mimetype)
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        parent.appendChild(iframe);

        const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : (window.location.origin + fileUrl);
        
        // Hole die Datei über den Background-Worker als Base64, um CORS und X-Frame-Options sicher zu umgehen
        chrome.runtime.sendMessage({ action: 'fetchBase64', url: absoluteUrl, auth: authHeader }, (response) => {
            if (response && response.success && response.base64) {
                try {
                    const byteCharacters = atob(response.base64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);

                    // Prüfe anhand der echten Dateisignatur (Magic Bytes / XML-Root), ob es wirklich eine XML-Rechnung ist.
                    // WICHTIG: Nicht auf response.contentType.includes('xml') prüfen, da .xlsx/.docx den Mimetype
                    // 'application/vnd.openxmlformats-officedocument...' haben (enthält ebenfalls den Substring "xml"!).
                    const isZipOrOffice = byteArray.length >= 4 && byteArray[0] === 0x50 && byteArray[1] === 0x4B; // 'PK' (ZIP/XLSX/DOCX)
                    const isPdf = byteArray.length >= 4 && byteArray[0] === 0x25 && byteArray[1] === 0x50 && byteArray[2] === 0x44 && byteArray[3] === 0x46; // '%PDF'
                    const headSample = new TextDecoder('utf-8').decode(byteArray.slice(0, 400)).replace(/^\uFEFF/, '').trim();
                    const isXmlContent = !isZipOrOffice && !isPdf && (
                        headSample.startsWith('<?xml') ||
                        headSample.includes('<rsm:CrossIndustryInvoice') ||
                        headSample.includes('<CrossIndustryInvoice') ||
                        headSample.includes('<Invoice') ||
                        headSample.includes('<ubl:Invoice') ||
                        headSample.includes('<CreditNote') ||
                        headSample.includes('<ubl:CreditNote')
                    );

                    if (isXmlContent) {
                        const xmlText = new TextDecoder('utf-8').decode(byteArray);
                        renderZugferdOverlay(parent, xmlText, fileUrl);
                        return;
                    }

                    // Falls im SmallPreview-Stream eine Office-Datei (.xlsx / .docx) steckt, an den Office-Zweig übergeben
                    const respType = (response.contentType || '').toLowerCase();
                    if (respType.includes('openxmlformats') || respType.includes('ms-excel') || respType.includes('msword')) {
                        parent.innerHTML = '';
                        appendFileContent(parent, fileUrl, respType.split(';')[0].trim(), authHeader);
                        return;
                    }

                    const blob = new Blob([byteArray], { type: mimetype || 'application/pdf' });
                    const blobUrl = URL.createObjectURL(blob);
                    iframe.src = blobUrl;

                    // Punkt 1: Prüfe bei PDFs im Hintergrund lautlos, ob eine eingebettete ZUGFeRD / Factur-X XML enthalten ist
                    if (isPdf) {
                        extractXmlFromPdfBytes(byteArray).then((embeddedXml) => {
                            if (!embeddedXml) return; // Normale PDF -> keinerlei Änderung an der Oberfläche

                            const report = validateZugferdXml(embeddedXml);
                            const passCount = report.checks.filter(c => c.status === 'pass').length;
                            const dotColor = report.isValid ? '#16a34a' : '#dc2626';
                            const statusLabel = report.isValid ? 'ZUGFeRD Konform' : 'ZUGFeRD Fehlerhaft';

                            parent.innerHTML = '';
                            const hybridWrapper = document.createElement('div');
                            hybridWrapper.style.cssText = 'width: 100%; height: 100%; display: flex; flex-direction: column; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';

                            // Ausklappbares Prüfprotokoll (standardmäßig eingeklappt)
                            const drawer = document.createElement('div');
                            drawer.style.cssText = 'display: none; max-height: 220px; overflow-y: auto; background: #ffffff; border-top: 1px solid #e2e8f0; padding: 8px 16px; flex-shrink: 0;';
                            drawer.innerHTML = `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0 8px 0; border-bottom: 1px solid #f1f5f9; margin-bottom: 4px;">
                                    <span style="font-size: 11px; font-weight: 600; color: #0f172a;">Prüfprotokoll (${report.format})</span>
                                    <span style="font-size: 11px; color: #64748b; font-family: monospace;">${report.profile}</span>
                                </div>
                                <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #334155;">
                                    ${report.checks.map(c => {
                                        const cDot = c.status === 'pass' ? '#16a34a' : (c.status === 'warn' ? '#d97706' : '#dc2626');
                                        const cTxt = c.status === 'pass' ? 'OK' : (c.status === 'warn' ? 'Hinweis' : 'Fehler');
                                        return `
                                            <tr style="border-bottom: 1px solid #f8fafc;">
                                                <td style="padding: 5px 8px; white-space: nowrap; font-weight: 500; width: 70px;">
                                                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${cDot};margin-right:6px;vertical-align:middle;"></span>${cTxt}
                                                </td>
                                                <td style="padding: 5px 8px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11px; color: #64748b; white-space: nowrap; width: 85px;">${c.id}</td>
                                                <td style="padding: 5px 8px; font-weight: 500; color: #0f172a; width: 32%;">${c.title}</td>
                                                <td style="padding: 5px 8px; color: #64748b;">${c.detail}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </table>
                            `;

                            const viewsArea = document.createElement('div');
                            viewsArea.style.cssText = 'flex: 1; display: flex; position: relative; overflow: hidden;';

                            iframe.style.flex = '1';
                            const zugferdContainer = document.createElement('div');
                            zugferdContainer.style.cssText = 'flex: 1; width: 100%; height: 100%; display: none;';

                            viewsArea.appendChild(iframe);
                            viewsArea.appendChild(zugferdContainer);

                            let zugferdController = null;

                            const bottomBar = document.createElement('div');
                            bottomBar.style.cssText = 'padding: 8px 16px; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748b; flex-shrink: 0;';
                            bottomBar.innerHTML = `
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="display: inline-flex; background: #f1f5f9; padding: 2px; border-radius: 6px; border: 1px solid #e2e8f0;">
                                        <button id="hyb-tab-pdf" style="padding: 4px 10px; font-size: 11px; font-weight: 600; border: none; border-radius: 4px; cursor: pointer; background: #ffffff; color: #0f172a; box-shadow: 0 1px 2px rgba(0,0,0,0.06);">
                                            Original-PDF
                                        </button>
                                        <button id="hyb-tab-en16931" style="padding: 4px 10px; font-size: 11px; font-weight: 500; border: none; border-radius: 4px; cursor: pointer; background: transparent; color: #64748b;">
                                            E-Rechnung
                                        </button>
                                        <button id="hyb-tab-xml" style="padding: 4px 10px; font-size: 11px; font-weight: 500; border: none; border-radius: 4px; cursor: pointer; background: transparent; color: #64748b;">
                                            XML-Code
                                        </button>
                                    </div>
                                    <span style="color: #cbd5e1;">|</span>
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${dotColor};"></span>
                                        <span style="font-weight: 500; color: #0f172a; font-size: 12px;">${statusLabel}</span>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <button id="hyb-toggle-report" style="padding: 5px 10px; font-size: 11px; font-weight: 500; cursor: pointer; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; border-radius: 5px;">
                                        Prüfprotokoll (${passCount}/${report.checks.length})
                                    </button>
                                    <button id="hyb-dl-xml" style="padding: 5px 10px; font-size: 11px; font-weight: 500; cursor: pointer; background: #0f172a; color: #ffffff; border: 1px solid #0f172a; border-radius: 5px;">
                                        XML speichern
                                    </button>
                                </div>
                            `;

                            hybridWrapper.appendChild(viewsArea);
                            hybridWrapper.appendChild(drawer);
                            hybridWrapper.appendChild(bottomBar);
                            parent.appendChild(hybridWrapper);

                            const tabPdf = bottomBar.querySelector('#hyb-tab-pdf');
                            const tabEn = bottomBar.querySelector('#hyb-tab-en16931');
                            const tabXml = bottomBar.querySelector('#hyb-tab-xml');
                            const allTabs = [tabPdf, tabEn, tabXml];

                            const activateTabStyle = (activeBtn) => {
                                allTabs.forEach(b => {
                                    if (b === activeBtn) {
                                        b.style.background = '#ffffff';
                                        b.style.color = '#0f172a';
                                        b.style.fontWeight = '600';
                                        b.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)';
                                    } else {
                                        b.style.background = 'transparent';
                                        b.style.color = '#64748b';
                                        b.style.fontWeight = '500';
                                        b.style.boxShadow = 'none';
                                    }
                                });
                            };

                            const ensureZugferdInitialized = (mode) => {
                                if (!zugferdController) {
                                    zugferdController = renderZugferdOverlay(zugferdContainer, embeddedXml, null, { hideFooter: true, initialMode: mode });
                                } else {
                                    zugferdController.setMode(mode);
                                }
                            };

                            tabPdf.onclick = () => {
                                activateTabStyle(tabPdf);
                                iframe.style.display = 'block';
                                zugferdContainer.style.display = 'none';
                            };

                            tabEn.onclick = () => {
                                activateTabStyle(tabEn);
                                iframe.style.display = 'none';
                                zugferdContainer.style.display = 'block';
                                ensureZugferdInitialized('visual');
                            };

                            tabXml.onclick = () => {
                                activateTabStyle(tabXml);
                                iframe.style.display = 'none';
                                zugferdContainer.style.display = 'block';
                                ensureZugferdInitialized('xml');
                            };

                            bottomBar.querySelector('#hyb-toggle-report').onclick = () => {
                                drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
                            };

                            bottomBar.querySelector('#hyb-dl-xml').onclick = () => {
                                const xmlBlob = new Blob([embeddedXml], { type: 'application/xml' });
                                const url = URL.createObjectURL(xmlBlob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'factur-x.xml';
                                a.click();
                                setTimeout(() => URL.revokeObjectURL(url), 2000);
                            };
                        }).catch(() => {});
                    }
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