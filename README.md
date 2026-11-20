<div align="center">

<img src="icons/128.png" alt="INFOR — PDF Multiview Logo" width="84" height="84" />

# INFOR — PDF Multiview (eInvoice Edition)

**Native Split-Screen Dokumentenvorschau & EN 16931 E-Rechnungs-Suite (ZUGFeRD / Factur-X / XRechnung) für Infor LN CloudSuite & IDM (v1 & v2)**

[![Version](https://img.shields.io/badge/Release-v2026.8.1-0072CE?style=for-the-badge)](https://github.com/SaschaArend/infor-pdf-multiview)
[![E-Rechnung](https://img.shields.io/badge/EN_16931-ZUGFeRD_%26_XRechnung-10B981?style=for-the-badge)](#-neu-integrierte-e-rechnungs--zugferd-suite-en-16931)
[![Infor IDM](https://img.shields.io/badge/Infor_IDM-v1_%26_v2_Widgets-38BDF8?style=for-the-badge)](#️-technische-architektur-v1--v2)
[![Live Demo](https://img.shields.io/badge/GitHub_Pages-Live_Landingpage-F59E0B?style=for-the-badge)](https://saschaarend.github.io/infor-pdf-multiview/)

<p align="center">
  <a href="https://saschaarend.github.io/infor-pdf-multiview/update.bat"><strong>⚡ Setup & Auto-Installer herunterladen (update.bat)</strong></a> •
  <a href="https://saschaarend.github.io/infor-pdf-multiview/"><strong>🌐 Interaktive Produktseite & Live-Simulator</strong></a> •
  <a href="https://github.com/SaschaArend/infor-pdf-multiview/archive/refs/heads/main.zip"><strong>📦 Komplettpaket (.ZIP)</strong></a>
</p>

</div>

---

## ⚡ Warum INFOR — PDF Multiview?

Bei der Rechnungsprüfung (`tfacp2600m000`), im Einkauf oder in der Auftragsbearbeitung in **Infor LN CloudSuite** müssen angehängte Belege aus **IDM (Connected Information / Related Information)** ständig gegengeprüft werden. Standardmäßig erzwingt das System oft unübersichtliche Mini-Vorschauen oder externe Datei-Downloads – und reine XML-Rechnungen (**XRechnung / ZUGFeRD**) sind ohne Zusatzsoftware kaum lesbar.

**INFOR — PDF Multiview** klinkt sich nahtlos in die Infor CloudSuite ein und öffnet ausgewählte IDM-Dokumente automatisch als **stufenlos verstellbares Split-Screen-Overlay** am rechten Bildschirmrand – inklusive vollautomatischer **E-Rechnungs-Aufbereitung und EN 16931 Validierung**.

---

## 🧾 NEU: Integrierte E-Rechnungs- & ZUGFeRD-Suite (EN 16931)

### 1. 🔍 Automatische Tiefenanalyse für hybride PDFs (ZUGFeRD / Factur-X)
Sobald eine PDF-Datei in Infor geöffnet wird, durchsucht die Erweiterung (`extractXmlFromPdfBytes`) die Binärdaten im Hintergrund lautlos nach eingebetteten XML-Rechnungen – selbst wenn diese in **FlateDecode-komprimierten PDF/A-3-Objektstreams** liegen.
* **Normale PDFs:** Werden wie gewohnt ohne zusätzliche Leisten im nativen PDF-Viewer angezeigt.
* **Hybride ZUGFeRD-PDFs:** Schalten automatisch eine intelligente Fußleiste frei, mit der du per Klick zwischen **`Original-PDF`**, **`E-Rechnung (DIN-A4 Visualisierung)`** und **`XML-Code`** wechseln sowie das eingebettete `factur-x.xml` direkt exportieren kannst.

### 2. 📄 Visueller Beleg-Generator für XML-Rechnungen (`CII` & `UBL 2.1`)
Reine XML-Belege (`application/xml`, `text/xml`) werden sowohl für **UN/CEFACT CrossIndustryInvoice (CII)** als auch **OASIS UBL 2.1 (Invoice & CreditNote)** automatisch in ein übersichtliches, druckfertiges **DIN-A4-Rechnungsblatt** übersetzt:
* Automatische Erkennung von **Rechnung (`380`)**, **Gutschrift (`381` / `261`)** und **Rechnungskorrektur (`384`)**.
* Strukturierte Darstellung von Verkäufer (inkl. USt-IdNr. / Steuernummer / Kontakt), Käufer, abweichender Lieferanschrift, Rechnungspositionen, Steueraufschlüsselung, Zahlungsbedingungen sowie IBAN & BIC.
* **Druck- & PDF-Export:** Über den Button *„Als PDF speichern"* lässt sich aus jeder reinen XML-Rechnung sofort ein sauberes PDF erzeugen.
* **XML-Code-Inspektor:** Umschaltbare Quelltext-Ansicht mit Zeilennummern, Syntax-Highlighting, **Live-Volltextsuche** (gelbe Treffer-Markierung) und 1-Klick-Kopierfunktion.

### 3. ✅ Mathematisches & formales Prüfprotokoll (`EN 16931` & `BR-DE`)
Jede erkannte E-Rechnung wird in Echtzeit gegen die europäischen **EN 16931 Business Rules** und deutschen **XRechnung-Regeln** validiert:
* **Pflichtfeld-Check:** Prozess-/Profilkennung (`BR-01` / `BT-24`), Rechnungsnummer (`BR-02`), Datum (`BR-03`), USt-IdNr./Steuernummer (`BR-CO-26`), Verkäuferkontakt (`BR-DE-2`), Käuferreferenz/Leitweg-ID (`BR-DE-15`) u. v. m.
* **Mathematische Nachberechnung:** Prüft auf den Cent genau, ob die Summe aller Einzelpositionen dem Netto-Gesamtbetrag entspricht (`BR-CO-10`) und ob `Steuerbasis + MwSt = Bruttogesamtbetrag` (`BR-CO-15`) aufgeht.

### 4. 🛠️ Standalone Drag-&-Drop Validator (über Rechtsklick auf das Browser-Icon)
Du möchtest eine externe PDF- oder XML-Rechnung prüfen, die noch gar nicht in Infor liegt?
* Klicke mit der **rechten Maustaste** auf das **INFOR — PDF Multiview** Icon oben in der Browserleiste und wähle **„ZUGFeRD / E-Rechnung prüfen"**.
* Ziehe eine beliebige `.pdf`- oder `.xml`-Datei per Drag & Drop in das Prüffenster – das Tool extrahiert die Daten sofort lokal im Browser.

---

## 🧩 Alle unterstützten Dateiformate (Multi-Format Engine)

| Format | Dateiendungen | MIME-Type / Signatur | Vorschau-Engine im Overlay | Standard-Breite |
| :--- | :--- | :--- | :--- | :---: |
| **Hybride PDF/A-3** | `.pdf` | `application/pdf` + `FlateDecode XML` | 3-Tab-Ansicht (`Original-PDF` \| `E-Rechnung` \| `XML-Code`) + EN 16931 Prüfprotokoll | `50%` |
| **XML E-Rechnung** | `.xml` | `application/xml`, `text/xml` | DIN-A4 Beleg-Visualisierung (CII & UBL) + XML-Code-Inspektor mit Suche & PDF-Druck | `50%` |
| **Standard-PDF** | `.pdf` | `application/pdf` (`%PDF`) | Nativer Browser-PDF-Viewer (Base64-Stream via Service Worker inkl. Zoom, Drucken & Drehen) | `50%` |
| **Excel & Word** | `.xlsx`, `.xls`, `.docx`, `.doc` | `application/vnd.openxmlformats-*` (`PK`) | Eingebetteter **Microsoft Office Online Viewer** + Download-Button | `30%` |
| **Outlook E-Mail** | `.msg` | `application/vnd.ms-outlook` | Lokaler Binär-Parser (`DataStream.js` + `msgreader.js`) inkl. **CID-Inline-Bildern** & Download | `50%` |
| **Standard E-Mail** | `.eml` | `message/rfc822` | Multipart- & Quoted-Printable-Parser (Betreff, Von, An, Datum & Text) | `50%` |
| **Bilder & Scans** | `.png`, `.jpg`, `.gif`, `.webp`, `.svg` | `image/*` | Zentrierte, verlustfrei skalierte Vollbild-Vorschau | `50%` |

---

## 🛠️ Weitere Komfort-Funktionen im Alltag

* **Kompatibel mit Infor v1 & v2 Widgets:** Unterstützt sowohl die klassische IDM-Suche (`/api/bc/search`) als auch die neuen **Infor v2 Connected Information Widgets** (`SmallPreview/stream`).
* **Smart Magic-Byte-Erkennung:** Unterscheidet im binären Stream anhand der echten Dateisignatur (`%PDF`, `PK` bei `.xlsx`/`.docx`, `<?xml` bei E-Rechnungen) zuverlässig zwischen Office-Dokumenten, PDFs und XML-Dateien.
* **Re-Open bei erneutem Klick:** Wenn du das Overlay über `×` geschlossen hast und im IDM-Widget noch einmal auf dieselbe Dokumentenvorschau klickst (ohne dass Infor einen neuen Netzwerk-Request sendet), öffnet sich das Overlay sofort wieder.
* **Drag & Drop Größenanpassung:** Ziehe das Overlay am linken Griff stufenlos auf deine Wunschbreite (`localStorage.pdfWidth`).
* **1-Klick Toolbar-Schalter (`ON` / `OFF`):** Ein Linksklick auf das Erweiterungs-Icon deaktiviert das Overlay sofort (`OFF`-Badge) und schließt offene Fenster.

---

## 🏗️ Technische Architektur (v1 & v2)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. intercept.js (MAIN World @ document_start in allen iFrames)          │
│    • Hookt XMLHttpRequest & window.fetch + Click-Reopen-Listener        │
│    • Extrahiert Bearer Authorization-Header                             │
│    • Erkennt v1 (/api/bc/search) & leitet v2 (SmallPreview/stream) ab   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ window.top.postMessage()
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. content.js (ISOLATED World im Top-Window)                            │
│    • Magic-Byte-Sniffing (%PDF, PK, <?xml) & DecompressionStream        │
│    • EN 16931 / BR-DE Validator & DIN-A4 CII/UBL Beleg-Renderer         │
│    • Zeichnet das stufenlos skalierbare Split-Screen-Overlay            │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ chrome.runtime.sendMessage()
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. background.js (Manifest V3 Service Worker)                           │
│    • Lädt geschützte IDM-Streams inkl. Auth-Header (CSP/CORS-Bypass)    │
│    • Kontextmenü: "ZUGFeRD / E-Rechnung prüfen"                         │
│    • Prüft GitHub manifest.json auf neue Versionen                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation in 60 Sekunden

### Schritt 1 — Setup ausführen (`update.bat`)
Lade die [**`update.bat` (Setup & Auto-Updater)**](https://saschaarend.github.io/infor-pdf-multiview/update.bat) herunter und starte sie per Doppelklick. Das Skript erkennt automatisch eine Erstinstallation, lädt die aktuelle Version von GitHub herunter, entpackt alle Dateien sauber nach:

```text
%USERPROFILE%\Infor_Multiview_Extension
```

*(Alternativ kannst du auch das [ZIP-Archiv](https://github.com/SaschaArend/infor-pdf-multiview/archive/refs/heads/main.zip) manuell in diesen Ordner entpacken).*

### Schritt 2 — In Chrome oder Microsoft Edge aktivieren
1. Öffne `chrome://extensions` (Chrome) oder `edge://extensions` (Edge).
2. Aktiviere den **Entwicklermodus**.
3. Klicke auf **Entpackte Erweiterung laden** (*Load unpacked*) und wähle den Ordner `%USERPROFILE%\Infor_Multiview_Extension` aus.

### Schritt 3 — Aktualisieren per `WIN + R`
Sobald in Infor das Update-Banner erscheint (oder du manuell aktualisieren möchtest), drücke `WIN + R` und führe folgenden Befehl aus:

```cmd
"%USERPROFILE%\Infor_Multiview_Extension\update.bat"
```

---

<div align="center">
  <sub>Entwickelt für maximale Geschwindigkeit im Infor LN & IDM Tagesgeschäft • <strong>Sascha Arend</strong></sub>
</div>
