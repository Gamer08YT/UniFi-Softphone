import {Client} from "./Client";
// @ts-ignore
import {version} from "../package.json";

class Main {
    // Store VOIP Client Instance.
    private client = new Client();

    private digitsEl = document.getElementById('digits') as HTMLElement;
    private carrierEl = document.getElementById('carrier') as HTMLElement;
    private keys = Array.from(document.querySelectorAll('.key')) as HTMLElement[];
    private backspace = document.getElementById('backspace') as HTMLElement;
    private clearBtn = document.getElementById('clear') as HTMLElement;
    private callBtn = document.getElementById('call') as HTMLElement;
    private declineIncoming = document.getElementById('decline') as HTMLElement;
    private acceptIncoming = document.getElementById('accept') as HTMLElement;
    private setupSave = document.getElementById('saveConfig') as HTMLElement;
    private avatarContainer = document.getElementById('avatar-container') as HTMLElement;

    private number: string = '';
    private deleteInterval: number | null = null;

    /**
     * Constructor for initializing the Unofficial UniFi Softphone application.
     * Logs startup information and prepares the UI and VOIP client by invoking necessary configurations and registrations.
     * @return {void} No return value.
     */
    constructor() {
        console.info(`%cStarting Unofficial UniFi Softphone by Jan Heil (www.byte-store.de)!`, "font-family:system-ui;font-size:1rem;-webkit-text-stroke: 1px black;font-weight:bold");
        console.info(`Bundled Frontend Version: ${version}`);

        // Prepare UI and VOIP Client.
        this.registerListeners();

        // Handle TLS.
        this.handleSecure();

        // Handle Setup.
        if (this.needSetup()) {
            this.setSetup(true);
        } else {
            this.setSetup(false);
            this.registerClient();
        }
    }

    /**
     * Registers the client by establishing a connection with the specified server.
     *
     **/
    private async registerClient() {
        await this.client.connect(this.getValue("realm"), this.getValue("port"), this.getValue("username"), this.getValue("password"), this.getValue("wssMode")).then(r => console.log(r));
    }

    /**
     * Renders the current state of the component by updating the text content
     * of appropriate elements based on the value of the `number` property.
     *
     * @return {void} No return value.
     */
    private render(): void {
        this.digitsEl.textContent = this.number || '\u00A0';
        this.carrierEl.textContent = this.number ? '' : 'No number';
    }

    /**
     * Handles the pressing of a single digit and updates the current number accordingly.
     *
     * @param {string} d - The digit to be appended to the current number.
     * @return {void} This method does not return a value.
     */
    private pressDigit(d: string): void {
        if (this.client.isCalling()) {
            this.client.sendDTMF(d);
        }

        if (this.number.length >= 20) return;
        this.number += d;
        this.render();
    }

    /**
     * Registers event listeners for various user interactions, including key presses, clicks,
     * and pointer events, to manage digit input, backspace functionality, clearing the input,
     * and initiating a call operation.
     *
     * This method binds listeners to the following:
     * - Key elements for digit input via click and keyboard events.
     * - Backspace button for single-character deletion and continuous deletion on hold.
     * - "Clear" button to reset the input.
     * - "Call" button to initiate a call if valid input is provided.
     * - Keyboard events for digit input, special keys (`*`, `#`), and controls (e.g., Backspace, Enter).
     *
     * @return {void} No return value.
     */
    private registerListeners() {
        // Add Account Listener.
        this.avatarContainer.addEventListener('click', () => {
            this.setSetup(true);
        });

        // Add Setup Listener.
        this.setupSave.addEventListener('click', () => {
            // @ts-ignore
            let username = document.getElementById("usernameField").value;

            // @ts-ignore
            let realm = document.getElementById("realmField").value;

            // @ts-ignore
            let password = document.getElementById("passwordField").value;

            // @ts-ignore
            let secure = document.getElementById("wssMode").checked;

            const split = realm.split(":");
            let port = 5066;

            // Check if realm contains port.
            if (split.length > 1) {
                console.log(`Realm contains port: ${split[1]}`);

                port = parseInt(split[1]);
                realm = split[0];
            }

            console.log(`Setup: ${username} / ${realm} / ${password} / ${secure}`);


            // Check credentials before saving.
            this.client.connect(realm, port, username, password, secure).then(value => {
                this.setValue("username", username);
                this.setValue("realm", realm);
                this.setValue("password", password);
                this.setValue("port", port);
                this.setValue("wssMode", secure);

                this.setSetup(false);
            }).catch(reason => {
                document.getElementById("connectionFailedAlert")?.removeAttribute("hidden");

                console.error(`Failed to connect to server: ${reason}`);
            })


        });

        this.keys.forEach(k => {
            const digit = k.getAttribute('data-digit');
            k.addEventListener('click', () => {
                if (digit) this.pressDigit(digit);
            });

            k.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    k.click();
                }
            });
        });

        this.backspace.addEventListener('click', () => {
            this.number = this.number.slice(0, -1);
            this.render();
        });

        this.backspace.addEventListener('pointerdown', () => {
            if (this.deleteInterval) window.clearInterval(this.deleteInterval);

            this.deleteInterval = window.setInterval(() => {
                this.number = this.number.slice(0, -1);
                this.render();
                if (this.number.length === 0 && this.deleteInterval) {
                    window.clearInterval(this.deleteInterval);
                    this.deleteInterval = null;
                }
            }, 120);
        });

        ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => {
            this.backspace.addEventListener(ev, () => {
                if (this.deleteInterval) {
                    window.clearInterval(this.deleteInterval);
                    this.deleteInterval = null;
                }
            });
        });

        this.clearBtn.addEventListener('click', () => {
            this.number = '';
            this.render();
        });

        this.callBtn.addEventListener('click', () => {
            if (!this.number) {
                this.callBtn.classList.add('shake');
                setTimeout(() => this.callBtn.classList.remove('shake'), 300);
                return;
            }

            if (!this.client.isCalling()) {
                this.client.call(this.number);
            } else
                this.client.hangup();
        });

        this.declineIncoming.addEventListener('click', () => this.client.decline());
        this.acceptIncoming.addEventListener('click', () => this.client.anwser());

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (/^[0-9]$/.test(e.key)) this.pressDigit(e.key);
            if (e.key === '*') this.pressDigit('*');
            if (e.key === '#') this.pressDigit('#');

            if (e.key === 'Backspace') {
                this.number = this.number.slice(0, -1);
                this.render();
            }

            if (e.key === 'Enter') {
                this.callBtn.click();
            }
        });

    }

    /**
     * Checks if the necessary setup values are present in localStorage.
     * Determines whether the "username", "password", and "realm" keys exist in localStorage and contain non-null values.
     *
     * @return {boolean} Returns true if all required setup values ("username", "password", "realm") are present and not null in localStorage, otherwise false.
     */
    private needSetup() {
        return (localStorage.getItem("username") == null || localStorage.getItem("password") == null || localStorage.getItem("realm") == null);
    }

    /**
     * Toggles the visibility of elements with IDs "setup" and "phone"
     * based on the provided state value.
     *
     * @param {boolean} state - A boolean value to determine whether to show or hide the elements.
     *                          If true, the "setup" element is made visible and the "phone" element is hidden.
     *                         */
    private setSetup(state: boolean) {
        if (state)
            document.getElementById("config")?.removeAttribute("hidden");
        else
            document.getElementById("config")?.setAttribute("hidden", "hidden");

        if (state)
            document.getElementById("phone")?.setAttribute("hidden", "hidden");
        else
            document.getElementById("phone")?.removeAttribute("hidden");

        console.log(`Setup: ${state}`);
    }

    /**
     * Sets a key-value pair in the local storage and logs it to the console.
     *
     * @param {string} key - The key to set in the local storage.
     * @param {any} value - The value to associate with the specified key in the local storage.
     */
    private setValue(key: string, value: any) {
        console.log(`Set Value: ${key} = ${value}`);

        localStorage.setItem(key, value);
    }

    /**
     * Retrieves a value from local storage associated with the provided key.
     *
     * @param {string} key - The key whose associated value needs to be retrieved.
     * @return {string | null} The value associated with the key, or null if the key does not exist.
     */
    private getValue(key: string): string | null {
        return localStorage.getItem(key);
    }

    /**
     * Handles secure protocol by checking if the current page is loaded over HTTPS.
     * If the protocol is HTTPS, it removes the "hidden" attribute from the element
     * with an ID of "tlsAlert".
     *
     * @return {void} No return value.
     */
    private handleSecure() {
        if (window.location.protocol === "https:") {
            document.getElementById("tlsAlert")?.removeAttribute("hidden");
        }
    }
}

// Start the application.
new Main();