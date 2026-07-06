export class UniFiApi {

    private token: string = "";
    private csrfToken: string = "";
    private host: string = "";


public setHost(
    host: string
): void {

    this.host = host;
}


    public async login(
        host: string,
        username: string,
        password: string
    ): Promise<boolean> {

	this.host = host;

const response = await fetch(
    `https://${host}/api/auth/login`,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Origin": `https://${host}`,
            "Referer": `https://${host}/`
        },
        body: JSON.stringify({
            username: username,
            password: password,
            token: "",
            rememberMe: false
        }),
        credentials: "include"
    }
);


for (const pair of response.headers.entries()) {

    console.log(
        pair[0] + ": " + pair[1]
    );

}


console.log(
    "Login status:",
    response.status
);

console.log(
    "Set-Cookie:",
    response.headers.get("set-cookie")
);


console.log(
    "CSRF:",
    response.headers.get("x-csrf-token")
);


console.log(
    "Login URL:",
    response.url
);

if (!response.ok) {

    throw new Error(
        `Login failed (${response.status})`
    );
}

	    this.csrfToken =
            response.headers.get("x-csrf-token") || "";

        return true;
    }

    public async getContacts(): Promise<any[]> {

    	const response = await fetch(
        	`https://${this.host}/proxy/talk/api/contacts`,
        	{
            	method: "GET",
            	headers: {
                	"x-csrf-token": this.csrfToken
            		},
            	credentials: "include"
        		}
    		);

console.log(
    "Contacts status:",
    response.status
);

if (!response.ok) {

    const text =
        await response.text();

    console.error(
        "Contacts response:"
    );

    console.error(
        text
    );

    throw new Error(
        `Contacts failed (${response.status})`
    );
}
	
return await response.json();
}


	public async getUsers(): Promise<any[]> {

    const response = await fetch(
        `https://${this.host}/proxy/talk/api/users`,
        {
            method: "GET",
            credentials: "include"
        }
    );


console.log(
    "Users status:",
    response.status
);

const usersCsrfToken =
    response.headers.get("x-updated-csrf-token") ||
    response.headers.get("x-csrf-token") ||
    "";

console.log(
    "Users CSRF token:",
    usersCsrfToken
);

if (usersCsrfToken) {

    this.csrfToken =
        usersCsrfToken;

}


if (!response.ok) {

    const text =
        await response.text();

    console.error(
        "Users response:"
    );

    console.error(
        text
    );

    throw new Error(
        `Users failed (${response.status})`
    );

}

return await response.json();

}

	public async getCallLog(
    	userId: string
		): Promise<any> {

		    const response = await fetch(
        		`https://${this.host}/proxy/talk/api/call_log/user/${userId}?limit=10&offset=0`,
        	{
            method: "GET",
            credentials: "include"
        }
    );

    if (!response.ok) {

        throw new Error(
            `Call log failed (${response.status})`
        );
    }

    return await response.json();
}

public async updateUser(
    ulpId: string,
    data: any
): Promise<any> {


    if (!this.csrfToken) {

        throw new Error(
            "No CSRF token available"
        );

    }


 console.log(
        "UPDATE URL:",
        `https://${this.host}/proxy/talk/api/user/${ulpId}`
    );

    console.log(
        "CSRF TOKEN:",
        this.csrfToken
    );

    console.log(
        "UPDATE DATA:",
        JSON.stringify(
            data,
            null,
            2
        )
    );


    const response = await fetch(
        `https://${this.host}/proxy/talk/api/user/${ulpId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x-csrf-token": this.csrfToken
            },
            body: JSON.stringify(data),
            credentials: "include"
        }
    );

    if (!response.ok) {

        const text =
            await response.text();

        throw new Error(
            `Update failed (${response.status}): ${text}`
        );
    }

    const text =
        await response.text();

    console.log(
        "Update response:",
        text
    );

    return text;

}
}
