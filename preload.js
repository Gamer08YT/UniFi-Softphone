const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld(
    "credentials",
    {
        saveSipPassword: (password) =>
            ipcRenderer.invoke(
                "saveSipPassword",
                password
            ),

        getSipPassword: () =>
            ipcRenderer.invoke(
                "getSipPassword"
            ),

        saveUniFiPassword: (password) =>
            ipcRenderer.invoke(
                "saveUniFiPassword",
                password
            ),


getUniFiPassword: () =>
    ipcRenderer.invoke(
        "getUniFiPassword"
    ),

testUniFiLogin: (
    host,
    username,
    password
) =>
    ipcRenderer.invoke(
        "testUniFiLogin",
        host,
        username,
        password
    )



    }
);
