# INFOR – PDF Multiview Extension

Eine Browser-Erweiterung (Chrome/Edge) für **Infor LN** (CloudSuite), die Dokumente aus dem IDM (Infor Document Management) direkt als Overlay im Browser anzeigt – ohne den Hauptarbeitsbereich zu verlassen.

---

## ✨ Funktionen

| Dateiformat | Verhalten |
|---|---|
| **PDF** | Direkte Vorschau im integrierten Browser-Viewer |
| **Word (.doc, .docx)** | Vorschau über Microsoft Office Online Viewer |
| **Excel (.xls, .xlsx)** | Vorschau über Microsoft Office Online Viewer |
| **EML (E-Mail)** | Strukturierte Anzeige von Betreff, Absender, Empfänger und Text-Body |
| **MSG (Outlook)** | Anzeige der Metadaten (Betreff, Von, An, Datum) + Download-Button |
| **Bilder (PNG, JPG, GIF, …)** | Zentrierte Bildvorschau |

### Weitere Features

- **Drag & Drop Resize**: Die Breite des Overlays kann per Maus frei angepasst werden. Die gewählte Breite wird automatisch gespeichert.
- **Ein/Aus-Schalter**: Ein Klick auf das Erweiterungs-Icon aktiviert oder deaktiviert die Vorschau (`OFF`-Badge erscheint wenn inaktiv).
- **Update-Benachrichtigung**: Die Erweiterung prüft beim Start automatisch auf neue Versionen und zeigt einen Banner an.
- **Automatisches Schließen**: Das Overlay schließt sich, wenn der LN-Tab in Infor deaktiviert wird.

---

## 📦 Installation

1. Repository klonen oder als ZIP herunterladen
2. In Chrome/Edge: `chrome://extensions` öffnen
3. **Entwicklermodus** aktivieren (oben rechts)
4. **„Entpackte Erweiterung laden"** klicken
5. Den Ordner `Infor_Multiview_Extension` auswählen

---

## 🔧 Voraussetzungen

- Zugang zu **Infor LN CloudSuite** (`*.inforcloudsuite.com`)
- Chromium-basierter Browser (Google Chrome, Microsoft Edge)
- Internetzugang für die Office Online Viewer-Funktion (Word/Excel)

---

## 🗂️ Projektstruktur

```
Infor_Multiview_Extension/
├── manifest.json       # Konfiguration der Erweiterung (Berechtigungen, Dateien)
├── background.js       # Service Worker: Update-Check, Downloads, Fetch-Proxy
├── content.js          # Haupt-Logik: Overlay-UI, Datei-Viewer, EML-Parser
├── intercept.js        # XHR/Fetch-Interceptor: erkennt Datei-URLs in API-Antworten
├── lib/
│   ├── DataStream.js   # Hilfsbibliothek für binäre Dateioperationen (Abhängigkeit von msgreader)
│   └── msgreader.js    # Open-Source-Bibliothek zum Lesen von .msg-Dateien
└── icons/
    ├── 16.png
    ├── 48.png
    └── 128.png

```

---

## ⚙️ Berechtigungen

| Berechtigung | Zweck |
|---|---|
| `webRequest` | Netzwerkanfragen beobachten |
| `tabs` | Tabs ansprechen für Update-Benachrichtigung und Overlay-Steuerung |
| `storage` | Ein/Aus-Status und Update-Info speichern |
| `downloads` | Datei-Downloads ohne Navigations-Warnung auslösen |
| `host_permissions: *.inforcloudsuite.com` | Zugriff auf die Infor-Seite |
| `host_permissions: raw.githubusercontent.com` | Update-Check |

---

## 🔄 Update-Prozess

Die Erweiterung prüft beim Start automatisch gegen die Datei `manifest.json` im GitHub-Repository. Bei einer neueren Version erscheint ein Banner mit dem Hinweis, die `update.bat` im Installations-Ordner auszuführen.
