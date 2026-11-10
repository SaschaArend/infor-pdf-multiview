<div align="center">

<img src="icons/128.png" alt="INFOR — PDF Multiview Logo" width="84" height="84" />

# INFOR — PDF Multiview

**Native Split-Screen Dokumentenvorschau für Infor LN CloudSuite & Infor Document Management (IDM v1 & v2)**

[![Version](https://img.shields.io/badge/Release-v2026.8.1-0072CE?style=for-the-badge)](https://github.com/SaschaArend/infor-pdf-multiview)
[![Manifest V3](https://img.shields.io/badge/Chrome_%26_Edge-Manifest_V3-10B981?style=for-the-badge)](manifest.json)
[![Infor IDM](https://img.shields.io/badge/Infor_IDM-v1_%26_v2_Widgets-38BDF8?style=for-the-badge)](#technische-architektur-v1--v2)
[![Live Demo](https://img.shields.io/badge/GitHub_Pages-Live_Landingpage-F59E0B?style=for-the-badge)](https://saschaarend.github.io/infor-pdf-multiview/)

<p align="center">
  <a href="https://saschaarend.github.io/infor-pdf-multiview/"><strong>🌐 Interaktive Produktseite & Live-Demo öffnen</strong></a> •
  <a href="https://github.com/SaschaArend/infor-pdf-multiview/archive/refs/heads/main.zip"><strong>📦 ZIP herunterladen</strong></a> •
  <a href="#installation-in-60-sekunden"><strong>⚡ Schnellstart</strong></a>
</p>

</div>

---

## ⚡ Warum INFOR — PDF Multiview?

Bei der Rechnungsprüfung (`tfacp2600m000`), im Einkauf oder in der Auftragsbearbeitung in **Infor LN CloudSuite** müssen angehängte Belege aus **IDM (Connected Information / Related Information)** ständig gegengeprüft werden. Standardmäßig erzwingt das System oft unübersichtliche Mini-Vorschauen oder externe Datei-Downloads.

**INFOR — PDF Multiview** klinkt sich nahtlos in die Infor CloudSuite ein und öffnet ausgewählte IDM-Dokumente automatisch als **stufenlos verstellbares Split-Screen-Overlay** am rechten Bildschirmrand – ohne den aktuellen ERP-Tab zu verlassen.

---

## 🧩 Unterstützte Dateiformate (Multi-Format Engine)

| Format | Dateiendungen | MIME-Type | Vorschau-Engine im Overlay | Standard-Breite |
| :--- | :--- | :--- | :--- | :---: |
| **PDF-Belege** | `.pdf` | `application/pdf` | Nativer Browser-PDF-Viewer (Base64-Stream via Service Worker inkl. Zoom, Drucken & Drehen) | `50%` |
| **Excel & Word** | `.xlsx`, `.xls`, `.docx`, `.doc` | `application/vnd.openxmlformats-*` | Eingebetteter **Microsoft Office Online Viewer** | `30%` |
| **Outlook E-Mail** | `.msg` | `application/vnd.ms-outlook` | Lokaler Binär-Parser (`DataStream.js` + `msgreader.js`) für Kopfzeilen & Text + **Direkt-Download-Button** | `50%` |
| **Standard E-Mail** | `.eml` | `message/rfc822` | Integrierter RFC822-Parser (Betreff, Von, An, Datums- & Text-Dekodierung) | `50%` |
| **Bilder & Scans** | `.png`, `.jpg`, `.gif`, `.webp`, `.svg` | `image/*` | Zentrierte, verlustfrei skalierte Vollbild-Vorschau | `50%` |

---

## 🛠️ Kernfunktionen im Alltag

* **Kompatibel mit Infor v1 & v2 Widgets:** Unterstützt sowohl die klassische IDM-Suche (`/api/bc/search`) als auch die neuen **Infor v2 Connected Information Widgets** (`SmallPreview/stream`).
* **Drag & Drop Größenanpassung:** Ziehe das Overlay am linken Rahmen stufenlos auf deine Wunschbreite. Die Einstellung wird automatisch im Browser (`localStorage.pdfWidth`) gespeichert.
* **Intelligente LN-Kontexterkennung:** Das Overlay wird ausschließlich im Hauptfenster (`window.top`) gezeichnet und prüft aktiv, ob der Tab `LN` (`portal-tab-item[aria-label="LN"]`) geöffnet ist.
* **1-Klick Toolbar-Schalter (`ON` / `OFF`):** Ein Klick auf das Erweiterungs-Icon in Chrome oder Edge deaktiviert das Overlay sofort (`OFF`-Badge) und schließt offene Fenster – ideal für kleine Laptop-Bildschirme.
* **Integrierter Auto-Update-Assistent:** Prüft beim Browserstart automatisch das GitHub-Repository auf neue Releases und blendet bei Updates eine 1-Klick-Anleitung (`WIN + R` → `update.bat`) direkt oben in Infor ein.

---

## 🏗️ Technische Architektur (v1 & v2)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. intercept.js (MAIN World @ document_start in allen iFrames)          │
│    • Hookt XMLHttpRequest & window.fetch                                │
│    • Extrahiert Bearer Authorization-Header                             │
│    • Erkennt v1 (/api/bc/search) & leitet v2 (SmallPreview/stream) ab   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ window.top.postMessage()
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. content.js (ISOLATED World im Top-Window)                            │
│    • Prüft aktiven Infor LN Tab & Extension-Status (isEnabled)          │
│    • Zeichnet das stufenlos skalierbare Split-Screen-Overlay            │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ chrome.runtime.sendMessage()
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. background.js (Manifest V3 Service Worker)                           │
│    • Lädt geschützte IDM-Streams inkl. Auth-Header (CSP/CORS-Bypass)    │
│    • Konvertiert Binärdaten in Base64 / ArrayBuffer / Text              │
│    • Prüft GitHub manifest.json auf neue Versionen                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation in 60 Sekunden

### Schritt 1 — Dateien im Benutzerprofil ablegen
Lade dieses Repository als [ZIP-Archiv](https://github.com/SaschaArend/infor-pdf-multiview/archive/refs/heads/main.zip) herunter und entpacke den Inhalt in folgenden Ordner (damit auch das automatische Update per `update.bat` nahtlos funktioniert):

```text
%USERPROFILE%\Infor_Multiview_Extension
```
*(Alternativ per Git: `git clone https://github.com/SaschaArend/infor-pdf-multiview.git "%USERPROFILE%\Infor_Multiview_Extension"`)*

### Schritt 2 — In Chrome oder Microsoft Edge aktivieren
1. Öffne `chrome://extensions` (Chrome) oder `edge://extensions` (Edge).
2. Aktiviere oben rechts bzw. links den **Entwicklermodus**.
3. Klicke auf **Entpackte Erweiterung laden** (*Load unpacked*) und wähle den Ordner `%USERPROFILE%\Infor_Multiview_Extension` aus.

### Schritt 3 — Aktualisieren per `WIN + R`
Sobald in Infor das Update-Banner erscheint (oder du manuell aktualisieren möchtest), drücke `WIN + R` und führe folgenden Befehl aus:

```cmd
"%USERPROFILE%\Infor_Multiview_Extension\update.bat"
```

---

## 📁 Projektstruktur

```text
Infor_Multiview_Extension/
├── icons/                  # App-Icons (16px, 48px, 128px)
├── lib/
│   ├── DataStream.js       # Binär-Stream-Reader für Outlook-Dateien
│   └── msgreader.js        # Lokaler Parser für .msg Dokumente
├── background.js           # Service Worker (CSP-Proxy, Auth-Transfer & Update-Check)
├── content.js              # Overlay-UI, Drag-Resize, EML/MSG-Renderer & Update-Banner
├── intercept.js            # MAIN-World XHR/Fetch-Hook für Infor IDM v1 & v2
├── manifest.json           # Manifest V3 Konfiguration (v2026.8.1)
├── update.bat              # 1-Klick Updater über GitHub
└── index.html              # Interaktive GitHub Pages Produktseite
```

---

<div align="center">
  <sub>Entwickelt für maximale Geschwindigkeit im Infor LN & IDM Tagesgeschäft • <strong>Sascha Arend</strong></sub>
</div>
