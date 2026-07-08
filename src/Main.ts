import {Client} from "./Client";
import {UniFiApi} from "./UniFiApi";
// @ts-ignore
import {version} from "../package.json";

class Main {
    // Store VOIP Client Instance.
    private client = new Client();
    private unifiApi = new UniFiApi();
    private contactsOpen = false;
    private statusOpen = true;
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
    private contactsContainer = document.getElementById ("contactsContainer") as HTMLElement;
    private contactsToggle = document.getElementById("contactsToggle") as HTMLElement;
    private callLogContainer = document.getElementById("callLogContainer") as HTMLElement;
    private callLogToggle = document.getElementById("callLogToggle") as HTMLElement;
    private statusContainer = document.getElementById("statusContainer") as HTMLElement;
    private phoneStatus = document.getElementById("phoneStatus") as HTMLElement;
    private syncStatus = document.getElementById("syncStatus") as HTMLElement;
    private availabilityStatus = document.getElementById("availabilityStatus") as HTMLElement;
    private statusToggle = document.getElementById("statusToggle") as HTMLElement;
    private callLogOpen = false;
    private contacts: any[] = [];
    private number: string = '';
    private deleteInterval: number | null = null;
    private timer: number | undefined;
    private longPressDigit: string | null = null;
    private users: any[] = [];
    private redirectTypeNumber = document.getElementById("redirectTypeNumber") as HTMLInputElement;
    private redirectTypeContact = document.getElementById("redirectTypeContact") as HTMLInputElement;
    private redirectContactField = document.getElementById("redirectContactField") as HTMLSelectElement;
    private redirectNumberField = document.getElementById("redirectNumberField") as HTMLInputElement;
    private held = false;

    private LONG_CLICK_DURATION = 1000;

    /**
     * Constructor for initializing the Unofficial UniFi Softphone application.
     * Logs startup information and prepares the UI and VOIP client by invoking necessary configurations and registrations.
     * @return {void} No return value.
     */
    constructor() {
        console.info(`%cStarting Unofficial UniFi Softphone by Jan Heil (www.byte-store.de) and Thomas Schmidbaur (www.lautsound.de)!`, "font-family:system-ui;font-size:1rem;-webkit-text-stroke: 1px black;font-weight:bold");
        console.info(`Bundled Frontend Version: ${version}`);

        // Prepare UI and VOIP Client.
        this.registerListeners();

	if (
	    "Notification" in window
	) {

	    console.log(
	        "Notification permission:",
	        Notification.permission
	    );

	    if (
	        Notification.permission ===
	        "default"
	    ) {

	        Notification.requestPermission()
	            .then(
	                (permission) => {

	                    console.log(
	                        "Notification permission result:",
	                        permission
	                    );
	
	                }
	            );
	
	    }
	
	}

	this.redirectContactField.disabled =
	    true;

	window.addEventListener(
	    "sip-status",
	    (event: any) => {

	        const online =
	            event.detail.online;

	        if (online) {

	            this.phoneStatus.innerText =
	                "🟢 Telefon online";

	        } else {

	            this.phoneStatus.innerText =
	                "🔴 Telefon offline";

	        }

	    }
	);

        // Handle TLS.
        this.handleSecure();

	this.statusToggle.addEventListener("click",
	    () => {

	        this.statusOpen =
	            !this.statusOpen;

	        if (this.statusOpen) {

	            this.statusContainer.style.display =
	                "block";

	            this.statusToggle.innerText =
	                "▼ Status";

	        } else {

	            this.statusContainer.style.display =
	                "none";

	            this.statusToggle.innerText =
	                "▶ Status";

	        }

		}
	);

	this.contactsToggle.addEventListener(
        	    "click",
	            () => {

                	this.contactsOpen =
                    	!this.contactsOpen;

                	if (this.contactsOpen) {

                    	this.contactsContainer.style.display =
                        	"block";

                    	this.contactsToggle.innerText =
                        	"▼ Kontakte";

                	} else {

                    	this.contactsContainer.style.display =
                        "none";

                    	this.contactsToggle.innerText =
                        	"▶ Kontakte";
                	}
            	}
	);

	this.callLogToggle.addEventListener(
    		"click",
    		() => {

        		this.callLogOpen =
            		!this.callLogOpen;

	        	if (this.callLogOpen) {

	            	this.callLogContainer.style.display =
         		       	"block";

		        this.callLogToggle.innerText =
        		        "▼ Anrufliste";

	        	} else {

	        	this.callLogContainer.style.display =
         	       	"none";

	       		this.callLogToggle.innerText =
        	        	"▶ Anrufliste";

        		}
 	}
        );

        // Handle Setup.


        console.log(
            "needSetup:",
            this.needSetup()
        );

        if (this.needSetup()) {

            this.setSetup(true);

        } else {

            this.setSetup(false);

this.registerClient().then(async () => {

    const realm = this.getValue("realm");


    if (realm) {

        const unifiUser =
            this.getValue("unifiUser");

        // @ts-ignore
        const unifiPassword =
            await window.credentials.getUniFiPassword();

        if (unifiUser && unifiPassword) {
    
try {

            await this.unifiApi.login(
                realm,
                unifiUser,
                unifiPassword
            );

} catch (error) {


        console.error(
            "AUTO LOGIN FAILED:"
        );

        console.error(
            error
        );


	}
    }
        this.loadContacts();

	this.updateStatusDisplay();

        this.loadCallLog();

	this.updateStatusDisplay();

	setInterval(
	    () => {

		this.loadCallLog();	

	    },
	    30000
	);
    }

});

        }

	}

    /**
     * Registers the client by establishing a connection with the specified server.
     *
     **/

	private async registerClient() {
	
	        // @ts-ignore
    		const sipPassword =
        	await window.credentials.getSipPassword();

		await this.client.connect(
		this.getValue("realm"),
       		this.getValue("port"),
     		this.getValue("username"),
		sipPassword,
	        (this.getValue("wssMode") == "true")
	    );

setTimeout(async () => {

	    await this.client.setAvailability(
	        this.getValue("availability") || "available"
	    );
}, 3000);


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
        } else
            this.client.playDTMF(d);

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
    private registerListeners(): void {
        // Add Account Listener.
        this.avatarContainer.addEventListener('click', () => {
            this.setSetup(true);
        });


document
    .getElementById(
        "useUnifiPresenceField"
    )
    ?.addEventListener(
        "change",
        (event: any) => {

            const status =
                document.getElementById(
                    "useUnifiPresenceStatus"
                );

            if (event.target.checked) {

                status!.textContent =
                    "✓ Status will be synchronized to UniFi Talk";

                status!.className =
                    "text-success small mb-2";

            } else {

                status!.textContent =
                    "✕ Status is stored locally only";

                status!.className =
                    "text-danger small mb-2";

            }

        }
    );

document
    .getElementById(
        "wssMode"
    )
    ?.addEventListener(
        "change",
        (event: any) => {

            const status =
                document.getElementById(
                    "wssModeStatus"
                );

            if (event.target.checked) {

                status!.textContent =
                    "✓ Secure WebSocket (wss://d";

                status!.className =
                    "text-success small mb-2";

            } else {

                status!.textContent =
                    "✕Standarde WebSocket (ws://)";

                status!.className =
                    "text-danger small mb-2";

            }

        }
    );

this.redirectTypeNumber.addEventListener(
    "change",
    () => {



        console.log(
            "Telefonnummer gewählt"
        );


        this.redirectNumberField.disabled =
            false;

        this.redirectContactField.disabled =
            true;

    }
);

this.redirectTypeContact.addEventListener(
    "change",
    () => {

        this.redirectNumberField.disabled =
            true;

        this.redirectContactField.disabled =
            false;

    }
);


document
    .getElementById(
        "muteButton"
    )
    ?.addEventListener(
        "click",
        () => {

            const button =
                document.getElementById(
                    "muteButton"
                ) as HTMLButtonElement;

            if (
                this.client.isMuted()
            ) {

                this.client.unmute();

                button.textContent =
                    "Stumm";

            } else {

                this.client.mute();

                button.textContent =
                    "Stumm aus";

            }

        }
    );


document
    .getElementById(
        "holdButton"
    )
    ?.addEventListener(
        "click",
        async () => {

            const button =
                document.getElementById(
                    "holdButton"
                ) as HTMLButtonElement;

            if (
                this.held
            ) {

                await this.client.unhold();

                this.held =
                    false;

                button.textContent =
                    "Halten";

            } else {

                await this.client.hold();

                this.held =
                    true;

                button.textContent =
                    "Fortsetzen";

            }

        }
    );

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

	    // @ts-ignore
	    let availability = document.getElementById("availabilityField").value;

	    // @ts-ignore
	    let unifiUser =
	    document.getElementById("unifiUserField").value;

	    // @ts-ignore
	    let unifiPassword =
	    document.getElementById("unifiPasswordField").value;

	    // @ts-ignore
	    let redirectNumber = this.redirectTypeNumber.checked
		    ? (
	                document.getElementById(
             	        "redirectNumberField"
            	 	) as HTMLInputElement
        	).value
        	: this.redirectContactField.value;

	    // @ts-ignore
	    let useUnifiPresence =
	    document.getElementById("useUnifiPresenceField").checked;


            console.log(`Secure: ${secure}`);

            const split = realm.split(":");
            let port = 5066;

            // Check if realm contains port.
            if (split.length > 1) {
                console.log(`Realm contains port: ${split[1]}`);

                port = parseInt(split[1]);
                realm = split[0];
            }

            console.log(`Setup: ${username} / ${realm} / ${port} / ${password} / ${secure}`);


            // Check credentials before saving.
            this.client.connect(realm, port, username, password, secure).then(async value => {

		    document
		        .getElementById(
		            "connectionFailedAlert"
		        )
		        ?.setAttribute(
            		"hidden",
            		"hidden"
        		);

                this.setValue("username", username);
                this.setValue("realm", realm);
		
		// @ts-ignore
		await window.credentials.saveSipPassword(password);
	
                this.setValue("port", port);
                this.setValue("wssMode", secure);
		this.setValue("availability", availability);
		this.updateStatusDisplay();
		this.setValue("unifiUser", unifiUser);

		// @ts-ignore
		await window.credentials.saveUniFiPassword(unifiPassword);

		this.setValue("redirectNumber",	redirectNumber);

		this.setValue ("redirectType",
		this.redirectTypeContact.checked
	        	? "contact"
		        : "number"
		);

		this.updateStatusDisplay();

		this.setValue("useUnifiPresence", useUnifiPresence ? "true" : "false");
		this.updateStatusDisplay();

	this.loadContacts();

	this.loadCallLog();

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

            if (digit == "1" ||
	    digit == "0"
	    ) {
                // Add Long Press Listener (Voicemail).
                k.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.startPress(digit);
                });

                k.addEventListener('mouseup', () => {
                    this.cancelPress();
                });

                k.addEventListener('mouseleave', () => {
                    this.cancelPress();
                });

                // Touch-Events for Mobile Devices.
                k.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.startPress(digit);
                });

                k.addEventListener('touchend', () => {
                    this.cancelPress();
                });
            }
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

    		if (this.client.isCalling()) {
        	this.client.hangup();
        	return;
    		}

    		if (!this.number) {
        		this.callBtn.classList.add('shake');
        		setTimeout(() => this.callBtn.classList.remove('shake'), 300);
        		return;
    			}

    		this.client.call(this.number);
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
     * Initiates a press timer to detect a long press action.
     * The timer will trigger the `onLongClick` method after the duration
     * specified by `LONG_CLICK_DURATION`.
     *
     * @return {void}
     */

    private startPress(
    digit: string
	) {

	    this.longPressDigit =
        	digit;

	    console.log(
        	`Long Press waiting: ${digit}`
	    );

    // @ts-ignore
    this.timer = setTimeout(() => {
        this.onLongClick();
    }, this.LONG_CLICK_DURATION);

}


    /**
     * Handles the long click event by setting the caller number to a predefined value
     * and initiating a call to the voicemail service or selecting + on long clickung 0.
     *
     * @return {void} This method does not return any value.
     */

    private onLongClick() {

	    if (this.longPressDigit === "1") {

	        this.client.setDisplayNumber(
         	   "*86"
	        );

	        this.client.callVoicemail();

	        return;

	    }

	    if (this.longPressDigit === "0") {

	        this.number =
	            this.number.slice(0, -1);

	        this.number += "+";

        	this.render();

	    }

	}

    private cancelPress() {
        console.log(`Long Press cancelled`);

        clearTimeout(this.timer);
    }

    /**
     * Checks if the necessary setup values are present in localStorage.
     * Determines whether the "username" and "realm" keys exist in localStorage and contain non-null values.
     *
     * @return {boolean} Returns true if all required setup values ("username", "realm") are present and not null in localStorage, otherwise false.
     */
    private needSetup() {
        return (localStorage.getItem("username") == null || localStorage.getItem("realm") == null);
    }

    /**
     * Toggles the visibility of elements with IDs "setup" and "phone"
     * based on the provided state value.
     *
     * @param {boolean} state - A boolean value to determine whether to show or hide the elements.
     *                          If true, the "setup" element is made visible and the "phone" element is hidden.
     *                         */
    private async setSetup(state: boolean) {
        // Update Setup Interface.
        if (state) {
            document.getElementById("usernameField")?.setAttribute("value", this.getValue("username") || "");

	    // @ts-ignore
	    const sipPassword =
            await window.credentials.getSipPassword();
	    document.getElementById("passwordField")
    	    ?.setAttribute("value", sipPassword || "");

            document.getElementById("realmField")?.setAttribute("value", (this.getValue("realm") || "unifi") + (this.getValue("port") != null && this.getValue("port") != "5066" ? `:${this.getValue("port")}` : ""));

	// @ts-ignore
		document.getElementById("availabilityField").value =
    		this.getValue("availability") || "available";

	// @ts-ignore
		document.getElementById("redirectNumberField").value =
    		this.getValue("redirectNumber") || "";

		const redirectType =
		this.getValue(
	        "redirectType"
		);

		if (redirectType === "contact") {

		    this.redirectTypeContact.checked =
		        true;

		    this.redirectTypeNumber.checked =
		        false;

		    this.redirectContactField.disabled =
		        false;

		    this.redirectNumberField.disabled =
		        true;

		} else {

		    this.redirectTypeNumber.checked =
		        true;

		    this.redirectTypeContact.checked =
		        false;

		    this.redirectContactField.disabled =
		        true;

		    this.redirectNumberField.disabled =
		        false;

		}



	// @ts-ignore
		document.getElementById("useUnifiPresenceField").checked =
    		this.getValue("useUnifiPresence") === "true";

		const syncStatus = document.getElementById("useUnifiPresenceStatus"
    		);

		if (
    		this.getValue("useUnifiPresence")
    		=== "true"
		) {

    			syncStatus!.textContent =
        		"✓ Status will be synchronized to UniFi Talk";

    			syncStatus!.className =
        		"text-success small mb-2";

		} else {

    			syncStatus!.textContent =
        		"✕ Status is stored locally only";

    			syncStatus!.className =
        		"text-danger small mb-2";

		}

	// @ts-ignore
		document.getElementById("unifiUserField").value =
		this.getValue("unifiUser") || "";

	// @ts-ignore
		const unifiPassword = await window.credentials.getUniFiPassword();

	// @ts-ignore
		document.getElementById("unifiPasswordField").value = unifiPassword || "";


            // @ts-ignore
            if (this.getValue("wssMode") == "true") {
                document.getElementById('wssMode')?.setAttribute("checked", "");
            } else {
                document.getElementById('wssMode')?.removeAttribute("checked");
            }

const wssStatus =
    document.getElementById(
        "wssModeStatus"
    );

if (this.getValue("wssMode") == "true") {

    wssStatus!.textContent =
        "✓ Secure WebSocket (wss://d";

    wssStatus!.className =
        "text-success small mb-2";

} else {

    wssStatus!.textContent =
        "✕Standard Websockett (ws://)";

    wssStatus!.className =
        "text-danger small mb-2";

}



        }

        if (state)
            document.getElementById("config")?.removeAttribute("hidden");
        else
            document.getElementById("config")?.setAttribute("hidden", "hidden");

        if (state)
            document.getElementById("phone")?.setAttribute("hidden", "hidden");
        else
            document.getElementById("phone")?.removeAttribute("hidden");

	if (state)
	    document.getElementById("saveConfig")
            ?.removeAttribute("hidden");
	else
    	    document.getElementById("saveConfig")
            ?.setAttribute("hidden", "hidden");

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


private updateStatusDisplay(): void {

    const availability =
        this.getValue(
            "availability"
        );

    const useUnifiPresence =
    	this.getValue(
            "useUnifiPresence"
    	) === "true";

    const redirectNumber =
        this.getValue(
            "redirectNumber"
        );

    if (availability === "available") {

        this.availabilityStatus.innerText =
            "👤 Verfügbar";

    }

    if (availability === "dnd") {

        this.availabilityStatus.innerText =
            "👤 Nicht stören";

    }

	const redirectDisplayName =
	    this.resolveContactName(
	        redirectNumber
	    );

    if (availability === "redirect") {

        this.availabilityStatus.innerText =
            `👤 Rufumleitung:\n ${redirectDisplayName}`;

    }

	const online =  document
        .getElementById("call")
        ?.hasAttribute("disabled")
        === false;

	if (useUnifiPresence) {

	    this.syncStatus.innerText =
        	"🟢 UniFi Server Sync";

	} else {

	    this.syncStatus.innerText =
        	"⚪ UniFi Server Sync";

	}

	if (online) {

	    this.phoneStatus.innerText =
	        "🟢 Telefon online";

	} else {

	    this.phoneStatus.innerText =
	        "🔴 Telefon offline";

	}
}


private loadContacts(): void {

    const realm =
        this.getValue("realm");

    if (!realm) {
        return;
    }

    this.unifiApi.setHost(
        realm
    );

    this.unifiApi.getContacts()
        .then((contacts) => {

        this.contacts =
	    contacts;

	this.redirectContactField.innerHTML =
	    "";

	contacts.forEach(
	    (contact: any) => {

	        const option =
	            document.createElement(
	                "option"
	            );

	        const fullName =
	            `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim();

	        option.text =
	            fullName;

	        option.value =
	            contact.phone_numbers?.[0]?.did ?? "";

	        this.redirectContactField
	            .appendChild(
	                option
	            );
	
	    }
	);

	const redirectNumber =
	    this.getValue(
	        "redirectNumber"
	    );

	if (redirectNumber) {

	    this.redirectContactField.value =
	        redirectNumber;

	}

	this.updateStatusDisplay();

console.log(
    "First contact:"
);

console.log(
    contacts[0]
);


            this.renderContacts(
                contacts
            );

        })
        .catch((error) => {

            console.error(
                "Contacts failed:"
            );

            console.error(
                error
            );

        });

}

private resolveContactName(
    number: string
): string {

    const contact =
        this.contacts.find(
            (contact: any) => {

                if (
                    !contact.phone_numbers
                ) {

                    return false;

                }

                return contact.phone_numbers.some(
                    (phone: any) =>
                        phone.did === number
                );

            }
        );

    if (contact) {

        const fullName =
            `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim();

        return fullName;

    }

const user =
    this.users.find(
        (user: any) =>
            user.ext === number
    );

if (user) {

    const name =
        user.full_name ||
        user.username ||
        number;

    return name;

}

    return number;

}

private loadCallLog(): void {

    this.unifiApi.getUsers()
        .then((users) => {

	    this.users = users;

            const currentUser =
                users.find(
                    (u: any) => u.isSelf === true
                );

	    		const targetUser =
    			currentUser;

		if (targetUser) {


const availability =
    this.getValue("availability");

const useUnifiPresence =
    this.getValue(
        "useUnifiPresence"
    ) === "true";

console.log(
    "Availability value:",
    availability
);

console.log(
    "LocalStorage availability:",
    localStorage.getItem("availability")
);

let status = "Available";

if (availability === "dnd") {
    status = "Do Not Disturb";
}

if (availability === "redirect") {
    status = "Redirect";
}

const redirectNumber =
    this.getValue("redirectNumber");

if (!useUnifiPresence) {

    console.log(
        "UniFi availability sync disabled."
    );

} else {

this.unifiApi.updateUser(
    targetUser.ulp_id,
    {
        ...targetUser,
        status: status,
        redirect: {
            number: redirectNumber,
            entity: ""
        }
    }
)


    			.then((result) => {
			
			this.syncStatus.innerText =
			    "🟢 UniFi Server Sync";


        		console.log(
            		"Update result:"
        		);

        		console.log(
            		result
        		);
    			})
    			.catch((error) => {

       			console.error(
            		"Update failed:"
        		);

			
			this.syncStatus.innerText =
		        "🔴 UniFi Server Sync";

        		console.error(
            		error
        		);

    		});

		}

	}

            if (!currentUser) {
                throw new Error(
                    "Current user not found"
                );
            }

            return this.unifiApi.getCallLog(
                currentUser.unique_id
            );

        })

    .then((data) => {

        console.log(
            "Call Log:"
        );


console.log(
    JSON.stringify(
        data.calls[0],
        null,
        2
    )
);


console.log(
    "Number of calls:",
    data.calls?.length
);

console.log(
    data
);


	this.renderCallLog(
    	data
	);

    })
    .catch((error) => {

        console.error(
            error
        );

    });
}

private renderCallLog(
    data: any
): void {

    this.callLogContainer.innerHTML = "";

    data.calls.forEach((call: any) => {


	const myExtension =
	    this.getValue(
        	"username"
    	);

	const outgoing =
    	    call.from === myExtension;

	
	const number =
	    call.from === myExtension
        	? call.to
        	: call.from;

	const displayName =
	    this.resolveContactName(
	        number
	    );

        const div =
            document.createElement("div");

        div.className =
            "contact-entry";

	const callTime =
    	new Date(call.time);

	const formattedDate =
	    callTime.toLocaleDateString(
        	"de-DE"
   	 );
	
	const formattedTime =
    	callTime.toLocaleTimeString(
        	"de-DE",
        	{
            	hour: "2-digit",
           	 minute: "2-digit"
        	}
    	);

	const minutes =
	    Math.floor(call.duration / 60);

	const seconds =
    		call.duration % 60;

	const formattedDuration =
    		`${minutes}:${seconds
        	.toString()
	        .padStart(2, "0")}`;


	let icon = outgoing
	    ? "📤"
	    : "📥";

	let color = outgoing
	    ? "#4da3ff"
	    : "#4caf50";

	if (call.status === "cancelled") {

	    if (outgoing) {

	        icon = "📤";
	        color = "#ff9800";

	    } else {

	        icon = "❌";
	        color = "#ff5252";

	    }

	}


	if (call.status === "voicemail") {

	    console.log(
	        "Voicemail call:",
	        call
	    );

	}

div.innerHTML = `

<div class="call-entry-main">

    <div
        style="
            color:${color};
            font-weight:bold;
        ">
        ${icon}
        ${displayName}
    </div>

    <div
        style="
            font-size:0.8rem;
            opacity:0.7;
            margin-left:22px;
        ">
        ${formattedDate}
        ${formattedTime} Uhr
	${call.status === "accepted"
	    ? `<br>Dauer: ${formattedDuration}`
	    : ""}

    </div>

</div>


${call.status === "voicemail" ? `
    <div
        class="voicemail-link"
        data-uuid="${call.uuid}"
    >
        <div>
            📬 Voicemail
        </div>

        <div class="voicemail-duration">
            Dauer: ${formattedDuration} Minuten
        </div>
    </div>
` : ""}

`;


const voicemailLink =
    div.querySelector(
        ".voicemail-link"
    ) as HTMLElement | null;

voicemailLink?.addEventListener(
    "click",
    async (event) => {

        event.preventDefault();
        event.stopPropagation();

        const uuid =
            voicemailLink.dataset.uuid;

        console.log(
            "Loading voicemail:",
            uuid
        );

        const voicemail =
            await this.unifiApi.getVoicemail(
                uuid!
            );

        console.log(
            "Voicemail data:"
        );


console.log(
    "Voicemail read_at:",
    voicemail.read_at
);



	const recording =
	    await this.unifiApi
		        .getVoicemailRecording(
        		    voicemail.file_path
	        );

		console.log(
	    	"Recording response:"
		);	

		console.log(
		recording
		);

        console.log(
            voicemail
        );


const blob =
    await recording.blob();

console.log(
    "Blob:",
    blob
);

const audioUrl =
    URL.createObjectURL(
        blob
    );

const audio =
    new Audio(
        audioUrl
    );

audio.play();



    }
);


        div.addEventListener(
            "click",
            () => {

                this.number = number;
                this.render();

            }
        );

        div.addEventListener(
            "dblclick",
            () => {

                this.number = number;
                this.render();

                this.callBtn.click();

            }
        );

        this.callLogContainer.appendChild(
            div
        );

    });
}

private renderContacts(
        contacts: any[]
    ): void {

        this.contactsContainer.innerHTML = "";

        contacts.forEach(contact => {

console.log(
    "Contact:",
    contact.first_name,
    contact.last_name
);




            const number =
                contact.phone_numbers?.[0]?.did || "";

            const div =
                document.createElement("div");

            div.className = "contact-entry";
	    div.style.cursor = "pointer";
	    div.addEventListener("click", () => {
        			this.number = number;
        			this.render();
    			}
			);

	    div.addEventListener(
    		"dblclick",
		    () => {

        	this.number = number;
        	this.render();

 	       this.callBtn.click();

    		}
		);

            div.innerHTML = `
                <div>
                    <strong>
                        ${contact.first_name}
                        ${contact.last_name}
                    </strong>
                </div>
                <div>
                    ${number}
                </div>
            `;

            this.contactsContainer.appendChild(
                div
            );

        });
    }


    private handleSecure() {
        if (window.location.protocol === "https:") {
            document.getElementById("tlsAlert")?.removeAttribute("hidden");
        }
    }
}

// Start the application.
new Main();
