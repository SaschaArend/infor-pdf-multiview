(function () {
    console.log("Infor Multiview: XHR Intercept script geladen auf " + window.location.href);

    const SUPPORTED_MIMETYPES = [
        'application/pdf',
        'application/xml',
        'text/xml',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'message/rfc822',
        'application/vnd.ms-outlook',
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
        'image/svg+xml'
    ];

    function getMimeType(filename) {
        if (!filename) return null;
        const ext = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            'pdf': 'application/pdf',
            'xml': 'application/xml',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'eml': 'message/rfc822',
            'msg': 'application/vnd.ms-outlook',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml'
        };
        return mimeTypes[ext] || null;
    }

    let lastDetectedResource = null;

    function notifyTopWindow(resource, authHeader) {
        if (!resource || !resource.url) return;
        lastDetectedResource = {
            url: resource.url,
            mimetype: resource.mimetype,
            auth: authHeader || (lastDetectedResource ? lastDetectedResource.auth : null)
        };
        window.top.postMessage({
            type: 'INFOR_MULTIVIEW_PDF_URL',
            url: lastDetectedResource.url,
            mimetype: lastDetectedResource.mimetype,
            auth: lastDetectedResource.auth
        }, '*');
    }

    function extractResourceFromData(data, requestUrl) {
        if (!data) return null;

        // 1. Standard /search Struktur (data.items.item = [...])
        const itemsList = (data.items && Array.isArray(data.items.item))
            ? data.items.item
            : (data.item ? (Array.isArray(data.item) ? data.item : [data.item]) : null);

        if (itemsList && itemsList.length > 0) {
            for (const item of itemsList) {
                if (item.resrs && Array.isArray(item.resrs.res)) {
                    const res = item.resrs.res.find(r => SUPPORTED_MIMETYPES.includes(r.mimetype));
                    if (res && res.url) {
                        return { url: res.url, mimetype: res.mimetype };
                    }
                }

                // Fallback (v2) - wenn resrs fehlt oder keinen direkten Stream hat, aber pid & filename existieren
                if (item.pid && item.filename) {
                    const mimetype = getMimeType(item.filename);
                    if (mimetype && SUPPORTED_MIMETYPES.includes(mimetype)) {
                        let baseUrl = requestUrl.split('?')[0]
                            .replace(/\/search$/i, '')
                            .replace(/\/items.*$/i, '');
                        if (!baseUrl.endsWith('/items')) {
                            // Stelle sicher, dass der Pfad auf /api/bc/items/<pid>/resource/stream zeigt, falls nötig
                        }
                        const url = baseUrl + '/' + encodeURIComponent(item.pid) + '/resource/stream';
                        return { url: url, mimetype: mimetype };
                    }
                }
            }
        }
        return null;
    }

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._inforUrl = url;
        return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
        this.addEventListener('load', function () {
            const url = this._inforUrl;
            if (url && typeof url === 'string') {
                let authHeader = this._inforAuthHeader || null;

                if (url.includes('SmallPreview/stream') || (url.includes('/resource/stream') && !url.includes('Thumbnail'))) {
                    const streamUrl = url.split('?')[0].replace('/SmallPreview/stream', '/stream');
                    console.log("Infor Multiview: Datei URL aus Stream abgeleitet:", streamUrl);
                    notifyTopWindow({ url: streamUrl, mimetype: 'application/pdf' }, authHeader);
                } else if (url.includes('search') || url.includes('/api/bc/') || url.includes('/idm/')) {
                    try {
                        if (this.responseText && this.responseText.trim().startsWith('{')) {
                            const response = JSON.parse(this.responseText);
                            const resource = extractResourceFromData(response, url);
                            if (resource) {
                                console.log("Infor Multiview: Datei URL aus JSON-Response extrahiert:", resource.url);
                                notifyTopWindow(resource, authHeader);
                            }
                        }
                    } catch (e) {}
                }
            }
        });
        return origSend.apply(this, arguments);
    };

    const origSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
        if (header && header.toLowerCase() === 'authorization') {
            this._inforAuthHeader = value;
        }
        return origSetRequestHeader.apply(this, arguments);
    };

    const origFetch = window.fetch;
    window.fetch = async function (...args) {
        let authHeader = null;
        if (args[1] && args[1].headers) {
            if (args[1].headers instanceof Headers) {
                authHeader = args[1].headers.get('Authorization');
            } else if (typeof args[1].headers === 'object') {
                const headerKey = Object.keys(args[1].headers).find(k => k.toLowerCase() === 'authorization');
                if (headerKey) authHeader = args[1].headers[headerKey];
            } else if (Array.isArray(args[1].headers)) {
                const headerPair = args[1].headers.find(h => h[0].toLowerCase() === 'authorization');
                if (headerPair) authHeader = headerPair[1];
            }
        }

        const response = await origFetch.apply(this, args);
        const url = args[0] instanceof Request ? args[0].url : args[0];
        if (url && typeof url === 'string') {
            if (url.includes('SmallPreview/stream') || (url.includes('/resource/stream') && !url.includes('Thumbnail'))) {
                const streamUrl = url.split('?')[0].replace('/SmallPreview/stream', '/stream');
                console.log("Infor Multiview (Fetch): Datei URL aus Stream abgeleitet:", streamUrl);
                notifyTopWindow({ url: streamUrl, mimetype: 'application/pdf' }, authHeader);
            } else if (url.includes('search') || url.includes('/api/bc/') || url.includes('/idm/')) {
                response.clone().json().then(data => {
                    const resource = extractResourceFromData(data, url);
                    if (resource) {
                        console.log("Infor Multiview (Fetch): Datei URL aus JSON-Response extrahiert:", resource.url);
                        notifyTopWindow(resource, authHeader);
                    }
                }).catch(() => {});
            }
        }
        return response;
    };

    // Wenn der Nutzer die Vorschau geschlossen hat und danach im "Verbundene Informationen"-Widget
    // erneut auf das Dokument / die SmallPreview klickt (ohne dass Infor einen neuen Netzwerk-Request feuert),
    // öffnen wir die zuletzt geladene Datei sofort wieder.
    document.addEventListener('click', function (e) {
        if (!lastDetectedResource) return;
        const target = e.target;
        if (!target || !target.closest) return;

        // Prüfe, ob der Klick innerhalb einer Dokumentenvorschau / SmallPreview / Dateikarte stattfindet
        const isPreviewInteraction = target.closest(
            '[class*="preview" i], [class*="document" i], [class*="thumbnail" i], [class*="attachment" i], [class*="card" i], [class*="item" i], img, canvas'
        );

        // Ignoriere Klicks auf Schließen-Buttons oder unser eigenes Overlay
        if (target.closest('#pdf-container') || target.closest('#infor-update-banner')) return;

        // Nur auslösen, wenn wir uns in einem Related-Information / IDM Kontext befinden oder ein Bild/Vorschau-Element geklickt wurde
        const isIdmFrame = window.location.href.toLowerCase().includes('idm') ||
            window.location.href.toLowerCase().includes('relatedinformation') ||
            document.title.toLowerCase().includes('information') ||
            document.querySelector('[class*="idm" i], [class*="preview" i]');

        if (isPreviewInteraction && isIdmFrame) {
            window.top.postMessage({
                type: 'INFOR_MULTIVIEW_REOPEN_IF_CLOSED',
                url: lastDetectedResource.url,
                mimetype: lastDetectedResource.mimetype,
                auth: lastDetectedResource.auth
            }, '*');
        }
    }, true);
})();
