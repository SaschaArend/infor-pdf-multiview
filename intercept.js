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

    function findFileResource(items) {
        if (items && items.item && Array.isArray(items.item) && items.item.length > 0) {
            for (const item of items.item) {
                if (item.resrs && Array.isArray(item.resrs.res)) {
                    const res = item.resrs.res.find(r => SUPPORTED_MIMETYPES.includes(r.mimetype));
                    if (res && res.url) {
                        return { url: res.url, mimetype: res.mimetype };
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
            if (this._inforUrl && typeof this._inforUrl === 'string' && this._inforUrl.includes('search')) {
                try {
                    const response = JSON.parse(this.responseText);
                    const resource = findFileResource(response.items);
                    if (resource) {
                        console.log("Infor Multiview: Datei URL aus search-Response extrahiert!", resource.url);
                        window.top.postMessage({
                            type: 'INFOR_MULTIVIEW_PDF_URL',
                            url: resource.url,
                            mimetype: resource.mimetype
                        }, '*');
                    } else {
                        console.log("Infor Multiview: search Request enthielt keine gültige Datei URL in resrs.res");
                    }
                } catch (e) {
                    // Ignorieren falls kein valides JSON
                }
            }
        });
        return origSend.apply(this, arguments);
    };

    const origFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await origFetch.apply(this, args);
        const url = args[0] instanceof Request ? args[0].url : args[0];
        if (url && typeof url === 'string' && url.includes('search')) {
            response.clone().json().then(data => {
                const resource = findFileResource(data.items);
                if (resource) {
                    console.log("Infor Multiview (Fetch): Datei URL aus search-Response extrahiert!", resource.url);
                    window.top.postMessage({
                        type: 'INFOR_MULTIVIEW_PDF_URL',
                        url: resource.url,
                        mimetype: resource.mimetype
                    }, '*');
                }
            }).catch(e => { });
        }
        return response;
    };
})();
