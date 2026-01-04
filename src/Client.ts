// @ts-ignore
import {version} from "../package.json";

import {Invitation, UserAgentOptions} from "sip.js/lib/api";
import {SimpleSoftphone} from "./extended/SimpleSoftphone";
import {SimpleUserOptions} from "sip.js/lib/platform/web";
import {NameAddrHeader} from "sip.js/lib/grammar/name-addr-header";

/**
 * Represents a Client class for establishing communication with a specified realm and handling calls.
 */
export class Client {
    // Store User Instance.
    private simpleUser: SimpleSoftphone | undefined;

    // Store Realm Hostname.
    private realm: string = "unifi";
    private callState: boolean = false;

    // @ts-ignore
    private incomingToast = new bootstrap.Toast(document.getElementById("toast-incoming"), {autohide: false});

    // Store Audio Element.
    private currentAudio: HTMLAudioElement | null = null;

    /**
     * Represents the Dual-Tone Multi-Frequency (DTMF) frequencies for each key on a telephone keypad.
     * Each key is associated with a pair of frequencies:
     * the row frequency and the column frequency.
     *
     * Keys and frequencies:
     * - "1": [697 Hz, 1209 Hz]
     * - "2": [697 Hz, 1336 Hz]
     * - "3": [697 Hz, 1477 Hz]
     * - "A": [697 Hz, 1633 Hz]
     * - "4": [770 Hz, 1209 Hz]
     * - "5": [770 Hz, 1336 Hz]
     * - "6": [770 Hz, 1477 Hz]
     * - "B": [770 Hz, 1633 Hz]
     * - "7": [852 Hz, 1209 Hz]
     * - "8": [852 Hz, 1336 Hz]
     * - "9": [852 Hz, 1477 Hz]
     * - "C": [852 Hz, 1633 Hz]
     * - "*": [941 Hz, 1209 Hz]
     * - "0": [941 Hz, 1336 Hz]
     * - "#": [941 Hz, 1477 Hz]
     * - "D": [941 Hz, 1633 Hz]
     *
     * The object maps each key (string) to a tuple where the first element is the
     * row frequency (number) and the second element is the column frequency (number).
     */
    private DTMF_FREQ: Record<string, [number, number]> = {
        "1": [697, 1209],
        "2": [697, 1336],
        "3": [697, 1477],
        "A": [697, 1633],
        "4": [770, 1209],
        "5": [770, 1336],
        "6": [770, 1477],
        "B": [770, 1633],
        "7": [852, 1209],
        "8": [852, 1336],
        "9": [852, 1477],
        "C": [852, 1633],
        "*": [941, 1209],
        "0": [941, 1336],
        "#": [941, 1477],
        "D": [941, 1633],
    };

    // Store Audio Context for DTMF.
    private audioCtx: AudioContext | null = null;

    /**
     * Retrieves the existing AudioContext instance or creates a new one if it does not exist.
     *
     * @return {AudioContext} The AudioContext instance used for audio operations.
     */
    private getAudioContext(): AudioContext {
        if (!this.audioCtx) this.audioCtx = new AudioContext();
        return this.audioCtx;
    }

    /**
     * Plays a Dual-Tone Multi-Frequency (DTMF) tone using the specified tone value, duration, and volume.
     * DTMF tones are commonly used for sending signals, such as during phone dialing.
     *
     * @param {string} tone - The DTMF tone to play, represented by a single character (e.g., '1', '2', 'A').
     * @param {number} [durationMs=120] - The duration of the tone in milliseconds (default is 120ms).
     * @param {number} [volume=0.15] - The volume level of the tone, ranging from 0 (silent) to 1 (maximum).
     * @return {Promise<Promise<void> | undefined>} - A promise that resolves once the DTMF tone is played, or undefined if the tone is invalid.
     */
    public async playDTMF(tone: string, durationMs = 120, volume = 0.15): Promise<Promise<void> | undefined> {
        console.log(`Playing DTMF Tone: ${tone}`);

        const key = tone.toUpperCase();
        const pair = this.DTMF_FREQ[key];
        if (!pair) return;

        const ctx = this.getAudioContext();

        // Wichtig in Browser/Electron: Audio erst nach User-Geste oder ctx.resume()
        if (ctx.state === "suspended") {
            await ctx.resume();
        }

        const now = ctx.currentTime;
        const duration = Math.max(0.02, durationMs / 1000);

        // Gain (Lautstärke) + sanfte Hüllkurve gegen Knackser
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.005);
        gain.gain.setValueAtTime(volume, now + duration - 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        // Zwei Oszillatoren (die zwei Frequenzen)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(pair[0], now);
        osc2.frequency.setValueAtTime(pair[1], now);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);

        // Aufräumen
        osc1.onended = () => {
            try {
                osc1.disconnect();
                osc2.disconnect();
                gain.disconnect();
            } catch {
                // ignore
            }
        };
    }


    /**
     * Establishes a connection to the specified realm with the provided credentials.
     *
     * @param {string} [realm="192.168.1.1"] - The address or realm to connect to. Defaults to "192.168.1.1".
     * @param port
     * @param {string} username - The username for authentication.
     * @param {string} password - The password for authentication.
     * @param secure
     * @return {void} No return value.
     */
    public async connect(realm: string = "unifi", port = 5066, username: string, password: string, secure: boolean): Promise<void> {
        console.log(`Connecting to FreeSwitch / UniFi Talk ${realm}...`);

        this.realm = realm;

        const options: SimpleUserOptions = {
            aor: this.getAOR(realm, username),
            media: {
                constraints: {
                    audio: true,
                    video: false
                },
                local: {
                    video: this.getVideoElement("localVideo")
                },
                remote: {
                    audio: this.getAudioElement("remoteAudio"),
                    video: this.getVideoElement("remoteVideo")
                }
            },
            userAgentOptions: {
                authorizationPassword: password,
                authorizationUsername: username,
                userAgentString: `UnofficialSoftphoneByteStore/${version}`
            }
        };

        const urlIO = this.getWSAPI(realm, port, secure);

        console.log(`Connecting to ${urlIO}`);

        // Construct a SimpleSoftphone instance
        this.simpleUser = new SimpleSoftphone(urlIO, options);

        // Supply delegate to handle inbound calls (optional)
        this.simpleUser.delegate = {
            onCallReceived: async (addr: NameAddrHeader) => {
                this.handleIncoming(addr);
            },
            onCallAnswered: () => {
                this.stopSound();
            },
            onCallHangup: () => {
                this.setCallState(null);
            },
            onServerConnect: () => {
                this.setUIState(true);
            },
            onServerDisconnect: () => {
                this.setUIState(false)
            },

        };

        // Connect to server
        await this.simpleUser?.connect();

        // Register to receive inbound calls (optional)
        await this.simpleUser?.register();
    }

    /**
     * Constructs a WebSocket API URL based on the provided realm and port.
     *
     * @param {string} realm - The realm or domain name for the WebSocket connection.
     * @param {number} port - The port number to be used in the WebSocket connection.
     * @param secure
     * @return {string} - The constructed WebSocket API URL.
     */
    private getWSAPI(realm: string, port: number, secure: boolean): string {
        let protocol = "ws";

        if (secure) {
            protocol += "s"
        }

        return protocol + "://" + realm + ":" + port;
    }


    /**
     * Generates an Address of Record (AOR) in the format of `sip:username@realm`.
     *
     * @param {string} realm - The realm part of the SIP address, typically representing the domain.
     * @param {string} username - The username part of the SIP address.
     * @return {string} The generated Address of Record (AOR) in the format `sip:username@realm`.
     */
    private getAOR(realm: string, username: string): string {
        return `sip:${username}@${realm}`;
    }

    /**
     * Initiates an outgoing call to the specified phone number.
     *
     * @return {Promise<void>} A promise that resolves once the call operation is initiated.
     * @param dial
     */
    public async call(dial: string): Promise<void> {
        let number = this.getRealmNumber(dial);

        // Play Dial Sound.
        this.playSound("outgoing.mp3");

        // Set Call State to true.
        this.setCallUIState(true);

        // Place call to the destination
        await this.simpleUser?.call(number, {
            inviteWithoutSdp: true
        });
    }

    /**
     * Retrieves an HTMLAudioElement by its ID.
     *
     * @param id The ID of the audio element to retrieve.
     * @return The HTMLAudioElement associated with the given ID.
     * @throws Error if the element is not found or is not an audio element.
     */
    private getAudioElement(id: string): HTMLAudioElement {
        const el = document.getElementById(id);
        if (!(el instanceof HTMLAudioElement)) {
            throw new Error(`Element "${id}" not found or not an audio element.`);
        }
        return el;
    }

    /**
     * Retrieves a video element from the DOM by its ID.
     *
     * @param {string} id - The ID of the video element to retrieve.
     * @return {HTMLVideoElement} The video element corresponding to the provided ID.
     * @throws {Error} If the element is not found or is not a video element.
     */
    private getVideoElement(id: string): HTMLVideoElement {
        const el = document.getElementById(id);
        if (!(el instanceof HTMLVideoElement)) {
            throw new Error(`Element "${id}" not found or not an video element.`);
        }
        return el;
    }

    /**
     * Generates a SIP URI string using the provided dial number and the realm.
     *
     * @param {string} dial - The dial number to be used in the SIP URI.
     * @return {string} The generated SIP URI string in the format `sip:{dial}@{realm}`.
     */
    private getRealmNumber(dial: string): string {
        return `sip:${dial}@${this.realm}`;
    }

    /**
     * Updates the UI state of the call element by toggling the "calling" class based on the provided state.
     *
     * @param {boolean} state - A boolean value indicating whether the UI should reflect an ongoing call (true) or not (false).
     * @return {void} Does not return a value.
     */
    private setCallUIState(state: boolean): void {
        console.log(`Set UI Call State: ${state}`);

        document.getElementById("call")?.classList.toggle("calling", state);

        if (!state) {
            this.stopSound();
        }

        this.callState = state;
    }

    /**
     * Updates the call state and sets the UI state based on the provided parameter.
     *
     * @param {any} param - The parameter used to determine the new call state.
     * A non-null value will result in setting the call UI state*/
    private setCallState(param: string | null = null): void {
        this.setCallUIState(param !== null);

        this.callState = (param !== null);

        if (!param) {
            // Stop Incoming Sound.
            this.stopSound()

            // Hide Incoming Toast if not connected.
            this.incomingToast.hide();
        }
    }

    /**
     * Updates the UI state by enabling or disabling certain UI elements based on the provided state.
     *
     * @param {boolean} state - A boolean value that determines the UI state. If true, certain UI components will be disabled; otherwise, they will be enabled.
     * @return {void} This method does not return any value.
     */
    private setUIState(state: boolean): void {
        console.log(`Set UI State: ${state}`);

        // Disable Call Button if not connected.
        if (!state)
            document.getElementById("call")?.setAttribute("disabled", "disabled");
        else
            document.getElementById("call")?.removeAttribute("disabled");

        // Hide Connection Toast if not connected.
        document.getElementById("toast-connection")?.setAttribute("hidden", !state ? "" : "block")

        if (!state)
            // Hide Incoming Toast if not connected.
            this.incomingToast.hide();
    }

    /**
     * Handles an incoming call by displaying the caller's details, showing an incoming toast,
     * and playing an incoming call sound.
     *
     * @param {Invitation} invite - The invitation object containing call details, such as the remote identity.
     * @return {void} This method does not return any value.
     */
    private handleIncoming(invite: NameAddrHeader): void {
        console.log("Incoming Call!");

        let displayNumber = invite.uri.user;
        let displayName = invite.displayName;

        // Set Caller Details.
        this.setIncomingUI(displayNumber, displayName);

        // Play Incoming Sound.
        this.playSound("incoming.mp3");

        this.incomingToast.show();
    }

    /**
     * Checks if the current state indicates an ongoing call.
     *
     * @return {boolean} Returns true if a call is ongoing, otherwise false.
     */
    isCalling(): boolean {
        return this.callState;
    }

    /**
     * Terminates an ongoing call by invoking the hangup method on the SimpleUser instance.
     * If there is no active call or the SimpleUser instance is unavailable, the method does nothing.
     *
     * @return {void} Does not return a value.
     */
    public hangup(): void {
        this.simpleUser?.hangup();
    }

    /**
     * Calls the `answer` method on the `simpleUser` object if it exists and is defined.
     * This provides functionality to trigger the response logic of `simpleUser`.
     *
     * @return {void} Does not return any value.
     */
    public async anwser(): Promise<void> {
        console.log(`Accepting incoming call.`);

        // Hide Incoming Toast.
        this.incomingToast.hide();

        // Stop Incoming Sound.
        this.stopSound();

        await this.simpleUser?.answer({});
    }

    /**
     * Declines the current action or request associated with the `simpleUser` object, if it exists.
     *
     * @return {void} Does not return any value.
     */
    public async decline(): Promise<void> {
        console.log(`Decline incoming call.`);

        // Hide Incoming Toast.
        this.incomingToast.hide();

        // Stop Incoming Sound.
        this.stopSound();

        await this.simpleUser?.decline();
    }

    /**
     * Plays a sound from the provided URL.
     *
     * @param {string} url - The URL of the audio file to play.
     * @return {Audio} The Audio object used to play the sound.
     */
    private playSound(url: string): HTMLAudioElement {
        console.log(`Playing Sound: ${url}`);

        if (this.currentAudio != null) {
            this.currentAudio.pause();
        }

        this.currentAudio = new Audio(url);
        this.currentAudio.loop = true;

        this.currentAudio.play().catch(error => {
            console.error("Playback failed:", error);
        });

        return this.currentAudio;
    }

    /**
     * Stops the currently playing audio, if any.
     * Pauses the audio playback associated with the currentAudio property.
     * @return {void} No return value.
     */
    private stopSound(): void {
        this.currentAudio?.pause();

        // Destroy Audio Element.
        // @ts-ignore
        this.currentAudio = null;
    }

    /**
     * Sends a Dual-Tone Multi-Frequency (DTMF) signal corresponding to the specified digit.
     *
     * @remarks This method currently only sends an SIP Frame, no Sound.
     * @param {string} digit - The DTMF digit to be sent. This is typically a numeric or valid DTMF character.
     * @return {void} This method does not return any value.
     */
    public sendDTMF(digit: string): void {
        console.log(`Sending DTMF: ${digit}`);

        // Play on Local Audio Element.
        this.playDTMF(digit, 120);

        this.simpleUser?.sendDTMF(digit);
    }

    /**
     * Updates the UI with the incoming caller's display name and number.
     *
     * @param {string | undefined} displayNumber - The incoming caller's phone number. Can be undefined.
     * @param {string | undefined} displayName - The incoming caller's display name. Can be undefined.
     * @return {void} This method does not return any value.
     */
    private setIncomingUI(displayNumber: string | undefined, displayName: string | undefined): void {
        let text = `${(displayName !== undefined) ? displayName + ` (${displayNumber})` : displayNumber}`;

        // @ts-ignore
        document.getElementById('incoming-name').innerText = text;
    }

    /**
     * Updates the text content of the element with the ID "display" to the specified string.
     *
     * @param {string} s The string to set as the text content of the display element.
     * @return {void} This method does not return a value.
     */
    public setDisplayNumber(s: string) {
        // @ts-ignore
        document.getElementById("display").textContent = s;
    }

    /**
     * Initiates a call to the voicemail service.
     * This method is designed to connect the user directly to their voicemail by
     * dialing the designated voicemail access number.
     *
     * @return {void} Does not return a value.
     */
    public callVoicemail() {
        console.log("Call Voicemail");

        // Call Voicemail.
        this.call("*86")
    }
}