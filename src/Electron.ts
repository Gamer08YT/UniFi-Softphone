
import {
    app,
    BrowserWindow,
    ipcMain,
    Notification
} from "electron"

app.commandLine.appendSwitch(
    "ignore-certificate-errors"
);

import * as path from "node:path";
import * as keytar from "keytar";

class Electron {
    private readonly SERVICE =
    "UnofficialUniFiTalkSoftphone";

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
	ipcMain.handle(
            "saveSipPassword",
            async (_event, password: string) => {

                await keytar.setPassword(
                    this.SERVICE,
                    "sipPassword",
                    password
                );

                return true;
            }
        );

        ipcMain.handle(
            "getSipPassword",
            async () => {

                return await keytar.getPassword(
                    this.SERVICE,
                    "sipPassword"
                );
            }
        );


	ipcMain.handle(
    	"saveUniFiPassword",
    		async (_event, password: string) => {

        	await keytar.setPassword(
            	this.SERVICE,
            	"unifiPassword",
            	password
        	);

	        return true;
    		}
	);
	
	ipcMain.handle(
    	"getUniFiPassword",
    			async () => {

        		return await keytar.getPassword(
            		this.SERVICE,
            		"unifiPassword"
        		);
    		}
	);

	ipcMain.handle(
	    "incomingCallNotification",
	    async (
	        _event,
	        caller: string
	    ) => {

	        const notification =
	            new Notification({
	                title: "Eingehender Anruf",
	                body: caller
	            });

	        notification.on(
	            "click",
	            () => {

       	        	 this.windowInstance?.show();
        	        this.windowInstance?.focus();

	            }
        );

        notification.show();

        return true;

    }
);


ipcMain.handle(
    "testUniFiLogin",
    async (
        _event,
        host: string,
        username: string,
        password: string
    ) => {

        try {

            const response = await fetch(
                `https://${host}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username,
                        password,
                        token: "",
                        rememberMe: false
                    })
                }
            );

            const text =
                await response.text();

            console.log(
                "MAIN LOGIN STATUS:",
                response.status
            );

            console.log(
                "MAIN LOGIN RESPONSE:",
                text
            );

            return {
                status: response.status,
                body: text
            };

        } catch (error) {

            console.error(
                "MAIN LOGIN ERROR:"
            );

            console.error(
                error
            );

            throw error;
        }
    }
);

        console.log("Registering Listeners");

        app.whenReady().then(() => {
            this.createWindow();

	    if (
	        Notification.isSupported()
	    ) {

	        console.log(
	            "Notifications supported"
	        );

	    }


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
