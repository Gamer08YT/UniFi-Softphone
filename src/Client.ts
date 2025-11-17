import {SimpleUser, SimpleUserOptions} from 'sip.js/lib/platform/web';
// @ts-ignore
import {version} from "../package.json";
import {SimpleSoftphone} from "./extended/SimpleSoftphone";
import {i} from "vite/dist/node/chunks/moduleRunnerTransport";
import {Invitation} from "sip.js/lib/api";

export class Client {
    // Store User Instance.
    private simpleUser: SimpleSoftphone | undefined;

    // Store Realm Hostname.
    private realm: string | undefined;
    private callState: boolean = false;

    // @ts-ignore
    private incomingToast = new bootstrap.Toast(document.getElementById("toast-incoming"), {autohide: false});

    // Store Audio Element.
    private currentAudio: HTMLAudioElement | null = null;

    /**
     * Establishes a connection to the specified realm with the provided credentials.
     *
     * @param {string} [realm="192.168.1.1"] - The address or realm to connect to. Defaults to "192.168.1.1".
     * @param {string} username - The username for authentication.
     * @param {string} password - The password for authentication.
     * @return {void} No return value.
     */
    public async connect(realm: string | null, port = 5066, username: string | null, password: string | null) {
        console.log(`Connecting to FreeSwitch / UniFi Talk ${realm}...`);

        this.realm = realm;

        const options: SimpleUserOptions = {
            aor: this.getAOR(realm, username),
            media: {
                remote: {
                    audio: this.getAudioElement("remoteAudio")
                }
            },
            userAgentOptions: {
                authorizationPassword: password,
                authorizationUsername: username,
                userAgentString: `UnofficialSoftphoneByteStore/${version}`
            }
        };

        // Construct a SimpleSoftphone instance
        this.simpleUser = new SimpleSoftphone(this.getWSAPI(realm, port), options);

        // Supply delegate to handle inbound calls (optional)
        this.simpleUser.delegate = {
            onCallReceived: async (invite: Invitation) => {
                this.handleIncoming(invite);
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
     * @return {string} - The constructed WebSocket API URL.
     */
    private getWSAPI(realm: string, port: number) {
        let protocol = "ws";

        if (localStorage.getItem("wssMode") == "true") {
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
    private getAOR(realm: string, username: string) {
        return `sip:${username}@${realm}`;
    }

    /**
     * Initiates an outgoing call to the specified phone number.
     *
     * @param {string} number - The phone number to call.
     * @return {Promise<void>} A promise that resolves once the call operation is initiated.
     */
    public async call(dial: string) {
        let number = this.getRealmNumber(dial);

        console.log(`Dialing ${number}`);

        // Play Dial Sound.
        this.playSound("outgoing.mp3");

        // Set Call State to true.
        this.setCallUIState(true);

        // Place call to the destination
        await this.simpleUser?.call(number);
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
     * Generates a SIP URI string using the provided dial number and the realm.
     *
     * @param {string} dial - The dial number to be used in the SIP URI.
     * @return {string} The generated SIP URI string in the format `sip:{dial}@{realm}`.
     */
    private getRealmNumber(dial: string) {
        return `sip:${dial}@${this.realm}`;
    }

    /**
     * Updates the UI state of the call element by toggling the "calling" class based on the provided state.
     *
     * @param {boolean} state - A boolean value indicating whether the UI should reflect an ongoing call (true) or not (false).
     * @return {void} Does not return a value.
     */
    private setCallUIState(state: boolean) {
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
    private setCallState(param: string | null = null) {
        this.setCallUIState(param !== null);

        this.callState = (param !== null);
    }

    /**
     * Updates the UI state by enabling or disabling certain UI elements based on the provided state.
     *
     * @param {boolean} state - A boolean value that determines the UI state. If true, certain UI components will be disabled; otherwise, they will be enabled.
     * @return {void} This method does not return any value.
     */
    private setUIState(state: boolean) {
        console.log(`Set UI State: ${state}`);

        // Disable Call Button if not connected.
        if (!state)
            document.getElementById("call")?.setAttribute("disabled", "disabled");
        else
            document.getElementById("call")?.removeAttribute("disabled");

        // Hide Connection Toast if not connected.
        document.getElementById("toast-connection")?.setAttribute("hidden", !state ? "" : "block")

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
    private handleIncoming(invite: Invitation) {
        console.log("Incoming Call!");

        let displayNumber = invite.remoteIdentity.uri.user;
        let displayName = invite.remoteIdentity.displayName;

        // Set Caller Details.
        this.setIncomingUI(displayNumber, displayName);
3
        this.incomingToast.show();
        this.simpleUser?.
            //this.simpleUser?.answer();
            // @ts-ignore

            // Play Incoming Sound.
            this.playSound("incoming.mp3");
    }

    /**
     * Checks if the current state indicates an ongoing call.
     *
     * @return {boolean} Returns true if a call is ongoing, otherwise false.
     */
    isCalling() {
        return this.callState;
    }

    /**
     * Terminates an ongoing call by invoking the hangup method on the SimpleUser instance.
     * If there is no active call or the SimpleUser instance is unavailable, the method does nothing.
     *
     * @return {void} Does not return a value.
     */
    public hangup() {
        this.simpleUser?.hangup();
    }

    /**
     * Calls the `answer` method on the `simpleUser` object if it exists and is defined.
     * This provides functionality to trigger the response logic of `simpleUser`.
     *
     * @return {void} Does not return any value.
     */
    public async anwser() {
        console.log(`Accepting incoming call.`);

        // Hide Incoming Toast.
        this.incomingToast.hide();

        // Stop Incoming Sound.
        this.stopSound();

        await this.simpleUser?.answer();
    }

    /**
     * Declines the current action or request associated with the `simpleUser` object, if it exists.
     *
     * @return {void} Does not return any value.
     */
    public async decline() {
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
    private playSound(url: string) {
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
    private stopSound() {
        this.currentAudio?.pause();
    }

    /**
     * Sends a Dual-Tone Multi-Frequency (DTMF) signal.
     * This method transmits a DTMF tone using the associated user's signaling system.
     *
     * @*/
    sendDTMF(digit: string) {
        console.log(`Sending DTMF: ${digit}`);

        this.simpleUser?.sendDTMF(digit);
    }

    /**
     * Updates the UI with the incoming caller's display name and number.
     *
     * @param {string | undefined} displayNumber - The incoming caller's phone number. Can be undefined.
     * @param {string | undefined} displayName - The incoming caller's display name. Can be undefined.
     * @return {void} This method does not return any value.
     */
    private setIncomingUI(displayNumber: string | undefined, displayName: string | undefined) {
        let text = `${(displayName !== undefined) ? displayName + ` (${displayNumber})` : displayNumber}`;

        // @ts-ignore
        document.getElementById('incoming-name').innerText = text;
    }
}