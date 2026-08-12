(function () {
    console.log("Infor Multiview: XHR Intercept script geladen auf " + window.location.href);

    const SUPPORTED_MIMETYPES = [
        'application/pdf',
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

    function findFileResource(items, requestUrl) {
        if (items && items.item && Array.isArray(items.item) && items.item.length > 0) {
            for (const item of items.item) {
                if (item.resrs && Array.isArray(item.resrs.res)) {
                    const res = item.resrs.res.find(r => SUPPORTED_MIMETYPES.includes(r.mimetype));
                    if (res && res.url) {
                        return { url: res.url, mimetype: res.mimetype };
                    }
                }
                
                // Fallback (v2) - wenn resrs fehlt, aber pid existiert (manche Dokumente haben keine Pre-Gen URL)
                if (item.pid && item.filename) {
                    const mimetype = getMimeType(item.filename);
                    if (mimetype && SUPPORTED_MIMETYPES.includes(mimetype)) {
                        // Konstruiere die alte funktionierende /resource/stream URL
                        // requestUrl ist z.B. .../api/bc/search?...
                        let baseUrl = requestUrl.split('?')[0].replace(/\/search$/i, ''); 
                        const url = baseUrl + '/' + item.pid + '/resource/stream';
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
                // XHR Auth Header extrahieren, falls Infor ihn gesetzt hat (bei Infor meist via setRequestHeader, 
                // da wir den aber nicht überschreiben, versuchen wir es als Fallback über die URL)
                let authHeader = null;
                if (this._inforAuthHeader) authHeader = this._inforAuthHeader;

                if (url.includes('search')) {
                    try {
                        const response = JSON.parse(this.responseText);
                        const resource = findFileResource(response.items, url);
                        if (resource) {
                            console.log("Infor Multiview: Datei URL aus search-Response extrahiert!", resource.url);
                            window.top.postMessage({
                                type: 'INFOR_MULTIVIEW_PDF_URL',
                                url: resource.url,
                                mimetype: resource.mimetype,
                                auth: authHeader
                            }, '*');
                        }
                    } catch (e) {}
                } else if (url.includes('SmallPreview/stream')) {
                    // Neues Widget v2 feuert keinen search Request beim Laden, sondern nur SmallPreview.
                    // Wir können die originale Datei-URL (default resource) ableiten, indem wir 'SmallPreview/' entfernen.
                    // Das ergibt exakt das alte URL-Format: /resource/stream anstatt /resource/SmallPreview/stream
                    const streamUrl = url.split('?')[0].replace('/SmallPreview/stream', '/stream');
                    console.log("Infor Multiview: Datei URL aus SmallPreview abgeleitet!", streamUrl);
                    window.top.postMessage({
                        type: 'INFOR_MULTIVIEW_PDF_URL',
                        url: streamUrl,
                        mimetype: 'application/pdf',
                        auth: authHeader
                    }, '*');
                }
            }
        });
        return origSend.apply(this, arguments);
    };

    // setRequestHeader hooken, um Auth-Header bei XHR abzufangen
    const origSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        if (header.toLowerCase() === 'authorization') {
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
            if (url.includes('search')) {
                response.clone().json().then(data => {
                    const resource = findFileResource(data.items, url);
                    if (resource) {
                        console.log("Infor Multiview (Fetch): Datei URL aus search-Response extrahiert!", resource.url);
                        window.top.postMessage({
                            type: 'INFOR_MULTIVIEW_PDF_URL',
                            url: resource.url,
                            mimetype: resource.mimetype,
                            auth: authHeader
                        }, '*');
                    }
                }).catch(e => { });
            } else if (url.includes('SmallPreview/stream')) {
                const streamUrl = url.split('?')[0].replace('/SmallPreview/stream', '/stream');
                console.log("Infor Multiview (Fetch): Datei URL aus SmallPreview abgeleitet!", streamUrl);
                window.top.postMessage({
                    type: 'INFOR_MULTIVIEW_PDF_URL',
                    url: streamUrl,
                    mimetype: 'application/pdf',
                    auth: authHeader
                }, '*');
            }
        }
        return response;
    };
})();
