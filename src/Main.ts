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
        this.registerClient();
    }

    /**
     * Registers the client by establishing a connection with the specified server.
     *
     **/
    private registerClient() {
        this.client.connect("192.168.1.1", 5066, "0009", "NGEKI/7HtCgu").then(r => console.log(r));
    }

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
}

// Start the application.
new Main();