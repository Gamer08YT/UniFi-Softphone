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



if (!response.ok) {

    const text =
        await response.text();

    console.error(
        "UniFi Login Response:"
    );

    console.error(
        text
    );

    console.error(
    "Login payload:"
);

console.error(
    JSON.stringify({
    username: username,
    passwordLength: password.length
    })

);	

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

    		if (!response.ok) {
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

    if (!response.ok) {

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

}
