@echo off

echo Packaging...

call npx @electron/packager . --out ./package --overwrite

echo Building...

call electron-windows-store --input-directory ./package --output-directory ./build --package-version 1.0.0.0 --package-name "UnofficialUniFiTalkSoftphone" --package-display-name "Unofficial UniFi Talk Softphone" --package-executable app/UnofficialUniFiTalkSoftphone-win32-x64/UnofficialUniFiTalkSoftphone.exe ^
    --publisher "CN=Byte-Store.DE" ^
    --publisher-display-name "Byte-Store.DE"