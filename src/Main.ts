import {Client} from "./Client";
import {UniFiApi} from "./UniFiApi";
// @ts-ignore
import {version} from "../package.json";

class Main {
    // Store VOIP Client Instance.
    private client = new Client();
    private unifiApi = new UniFiApi();
    private contactsOpen = false;

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
    private callLogOpen = false;

    private number: string = '';
    private deleteInterval: number | null = null;
    private timer: number | undefined;

    private LONG_CLICK_DURATION = 1000;

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


console.log("Realm:", realm);

console.log(
    "Page origin:",
    window.location.origin
);

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

        this.loadCallLog();

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

	    await this.client.setAvailability(
	        this.getValue("availability") || "available"
	    );

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
	    let redirectNumber =
	    document.getElementById("redirectNumberField").value;

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
                this.setValue("username", username);
                this.setValue("realm", realm);
		
		// @ts-ignore
		await window.credentials.saveSipPassword(password);
	
                this.setValue("port", port);
                this.setValue("wssMode", secure);
		this.setValue("availability", availability);
		this.setValue("unifiUser", unifiUser);

		// @ts-ignore
		await window.credentials.saveUniFiPassword(unifiPassword);

		this.setValue("redirectNumber",
    			redirectNumber);

/*		
this.unifiApi.login(
    realm,
    unifiUser,
    unifiPassword
).then(async () => {

    console.log("UniFi Login successful");

    const contacts =
        await this.unifiApi.getContacts();

    console.log(
        "UniFi Contacts:"
    );

    console.log(
        contacts
    );

}).catch(error => {

    console.error(
        `UniFi Login failed: ${error}`
    );

});
*/


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

            if (digit == "1") {
                // Add Long Press Listener (Voicemail).
                k.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.startPress();
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
                    this.startPress();
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
    private startPress() {
        console.log(`Long Press waiting: ${this.number}`);

        // Start Press Count Timer.
        // @ts-ignore
        this.timer = setTimeout(() => {
            this.onLongClick();
        }, this.LONG_CLICK_DURATION);
    }

    /**
     * Handles the long click event by setting the caller number to a predefined value
     * and initiating a call to the voicemail service.
     *
     * @return {void} This method does not return any value.
     */
    private onLongClick() {
        // Set Caller Number.
        this.client.setDisplayNumber("*86");

        // Call Voicemail.
        this.client.callVoicemail();
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

        }

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


console.log(
    "Contacts loaded:",
    contacts
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

private loadCallLog(): void {

    this.unifiApi.getUsers()
        .then((users) => {

            const currentUser =
                users.find(
                    (u: any) => u.isSelf === true
                );

	    		const targetUser =
    			users.find(
        		(u: any) => u.ext === "0002"
    			);


		if (targetUser) {


const availability =
    this.getValue("availability");

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

        		console.error(
            		error
        		);

    		});

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

        const number =
            call.to || call.from;

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



	
	let icon = "📥";
	let color = "#4caf50";

		if (call.direction === "out") {

		    icon = "📤";
    		    color = "#4da3ff";

		}

		if (call.status !== "accepted") {

		    icon = "❌";
		    color = "#ff5252";

		}

	div.innerHTML = `
		<div
    			style="
        		color:${color};
        		font-weight:bold;
    			">
    			${icon}
    			${number}
		</div>
    		<div
        		style="
            		font-size:0.8rem;
            		opacity:0.7;
            		margin-left:22px;
       		 ">
		        ${formattedDate}
        		${formattedTime} Uhr
			<br>Dauer: ${formattedDuration}
    		</div>
		`;


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
