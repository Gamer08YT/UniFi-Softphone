import { app, BrowserWindow } from "electron";

app.commandLine.appendSwitch(
    "ignore-certificate-errors"
);

import * as path from "node:path";

class Electron {
    private windowInstance: BrowserWindow | null = null;

    constructor() {
        this.registerListeners();
        this.registerTaskbar();
    }

    private createWindow(): void {
        this.windowInstance = new BrowserWindow({
            width: 1100,
            minWidth: 800,
            minHeight: 950,
            height: 1000,
            icon: path.join(__dirname, "../build/icon.png"),
            autoHideMenuBar: true,
            webPreferences: {
		preload: path.join(__dirname, "../preload.js"),
                devTools: true
            }
        });

        console.log("Window Created");

	this.windowInstance.loadFile("dist/index.html");
    }

    private registerListeners(): void {
        console.log("Registering Listeners");

        app.whenReady().then(() => {
            this.createWindow();

            app.on("activate", () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.createWindow();
                }
            });
        });

        app.on("window-all-closed", () => {
            if (process.platform !== "darwin") {
                app.quit();
            }
        });
    }

    private registerTaskbar(): void {
        console.log("Registering Taskbar");

        // Nur unter Windows verfügbar
        if (process.platform !== "win32") {
            return;
        }

        app.setUserTasks([
            {
                title: "Make a call",
                program: process.execPath,
                arguments: "makeCall",
                iconPath: path.join(__dirname, "../build/icon.png"),
                iconIndex: 0,
                description: "Make a call using the Unofficial UniFi Softphone"
            }
        ]);
    }

    private setFlash(state: boolean): void {
        this.windowInstance?.flashFrame(state);
    }

    private setWorkdir(): void {
        const workDir = path.join(__dirname);

        process.chdir(workDir);

        console.log(`Working Directory: ${workDir}`);
    }
}

new Electron();
