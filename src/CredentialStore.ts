import keytar from "keytar";

const SERVICE = "UnofficialUniFiTalkSoftphone";

export class CredentialStore {

    public static async saveSipPassword(password: string): Promise<void> {
        await keytar.setPassword(
            SERVICE,
            "sipPassword",
            password
        );
    }

    public static async getSipPassword(): Promise<string | null> {
        return await keytar.getPassword(
            SERVICE,
            "sipPassword"
        );
    }

    public static async saveUniFiPassword(password: string): Promise<void> {
        await keytar.setPassword(
            SERVICE,
            "unifiPassword",
            password
        );
    }

    public static async getUniFiPassword(): Promise<string | null> {
        return await keytar.getPassword(
            SERVICE,
            "unifiPassword"
        );
    }
}
