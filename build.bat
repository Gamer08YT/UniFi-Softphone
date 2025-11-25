 npx @electron/packager . --out ./package

electron-windows-store `
    --input-directory ./package `
    --output-directory ./build `
    --package-version 1.0.0.0 `
    --package-name Unofficial UniFi Talk Softphone