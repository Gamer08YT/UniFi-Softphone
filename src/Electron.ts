import {app, BrowserWindow} from 'electron';
import * as path from "node:path";

class Electron {


    constructor() {
        this.registerListeners();
    }

    /**
     * Creates and initializes a new browser window with specified configurations.
     * The window will have a predefined size, minimum dimensions, and loading a specific HTML file.
     *
     * @return {void} Does not return a value.
     */
    private createWindow(): void {
        const win = new BrowserWindow({
            width: 1100,
            minWidth: 800,
            minHeight: 950,
            height: 1000,
            autoHideMenuBar: true,
            webPreferences: {
                preload: path.join(__dirname, "preload.js"),
                devTools: true
            },
        });

        win.loadFile( "index.html");
    }

    /**
     * Registers event listeners for the application lifecycle.
     * Handles application readiness, window activation, and behavior when all windows are closed.
     *
     * @return {void} Does not return a value.
     */
    private registerListeners(): void {
        app.whenReady().then(() => {
            this.createWindow();

            app.on("activate", () => {
                if (BrowserWindow.getAllWindows().length === 0) this.createWindow();
            });
        });

        app.on("window-all-closed", () => {
            if (process.platform !== "darwin") app.quit();
        });
    }
}

// Start the application.
new Electron();