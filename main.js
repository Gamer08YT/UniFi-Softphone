const {app, BrowserWindow} = require("electron");
const path = require("path");

/**
 * Creates and initializes a new browser window with predefined dimensions, menu bar behavior,
 * and web preferences. The window is configured to load a specific HTML file for its content.
 *
 * @return {BrowserWindow} The created BrowserWindow instance.
 */
function createWindow() {
    const win = new BrowserWindow({
        width: 1100,
        minWidth: 800,
        minHeight: 950,
        height: 1000,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            devTools: false
        },
    });

    win.loadFile(path.join(__dirname, "dist", "index.html"));
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
