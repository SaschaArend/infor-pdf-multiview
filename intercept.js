(function () {
    console.log("Infor Multiview: XHR Intercept script geladen auf " + window.location.href);

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
                    let foundUrl = false;
                    if (response && response.items && Array.isArray(response.items.item) && response.items.item.length > 0) {
                        for (const item of response.items.item) {
                            if (item.resrs && Array.isArray(item.resrs.res)) {
                                const pdfRes = item.resrs.res.find(r => r.mimetype === 'application/pdf');
                                if (pdfRes && pdfRes.url) {
                                    console.log("Infor Multiview: PDF URL aus search-Response extrahiert!", pdfRes.url);
                                    window.top.postMessage({
                                        type: 'INFOR_MULTIVIEW_PDF_URL',
                                        url: pdfRes.url
                                    }, '*');
                                    foundUrl = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (!foundUrl) {
                        console.log("Infor Multiview: search Request enthielt keine gültige PDF URL in resrs.res");
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
                if (data && data.items && Array.isArray(data.items.item) && data.items.item.length > 0) {
                    for (const item of data.items.item) {
                        if (item.resrs && Array.isArray(item.resrs.res)) {
                            const pdfRes = item.resrs.res.find(r => r.mimetype === 'application/pdf');
                            if (pdfRes && pdfRes.url) {
                                console.log("Infor Multiview (Fetch): PDF URL aus search-Response extrahiert!", pdfRes.url);
                                window.top.postMessage({
                                    type: 'INFOR_MULTIVIEW_PDF_URL',
                                    url: pdfRes.url
                                }, '*');
                                return;
                            }
                        }
                    }
                }
            }).catch(e => { });
        }
        return response;
    };
})();
