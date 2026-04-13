@echo off
setlocal enabledelayedexpansion
color 0A
echo ===============================================================
echo INFOR PDF Multiview - Automatisches Update (GitHub)
echo ===============================================================
echo.

:: KONFIGURATION
set "REPO_URL=https://github.com/SaschaArend/infor-pdf-multiview/archive/refs/heads/main.zip"
set "TARGET_DIR=%USERPROFILE%\Infor_Multiview_Extension"
set "TEMP_ZIP=%TEMP%\infor_update.zip"
set "EXTRACT_DIR=%TEMP%\infor_extract"

echo 1. Lade neueste Version von GitHub herunter...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%REPO_URL%' -OutFile '%TEMP_ZIP%'"

if not exist "%TEMP_ZIP%" (
    echo.
    color 0C
    echo FEHLER: Download fehlgeschlagen! Bitte Internetverbindung prüfen.
    pause
    exit /b
)

echo 2. Entpacke Dateien...
if exist "%EXTRACT_DIR%" rmdir /s /q "%EXTRACT_DIR%"
mkdir "%EXTRACT_DIR%"
powershell -Command "Expand-Archive -LiteralPath '%TEMP_ZIP%' -DestinationPath '%EXTRACT_DIR%' -Force"

echo 3. Aktualisiere Programmordner...
:: Wir laden alles in einen temporären Unterordner, um Konflikte zu vermeiden
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

:: GitHub packt alles in einen Unterordner (REPRO-main), diesen muessen wir finden
set "SOURCE_SUBDIR="
for /d %%i in ("%EXTRACT_DIR%\*") do set "SOURCE_SUBDIR=%%i"

if defined SOURCE_SUBDIR (
    :: Kopiere alles aus dem ZIP-Unterordner in den Zielordner (ueberschreibt alles)
    xcopy "%SOURCE_SUBDIR%\*" "%TARGET_DIR%\" /s /e /y /q
)

echo 4. Bereinige temporaere Dateien...
del /q "%TEMP_ZIP%"
rmdir /s /q "%EXTRACT_DIR%"

echo.
echo.
echo ===============================================================
echo UPDATE ERFOLGREICH ABGESCHLOSSEN!
echo ===============================================================
echo.
echo Das Fenster schliesst sich automatisch in 5 Sekunden...
timeout /t 5 >nul
exit /b
