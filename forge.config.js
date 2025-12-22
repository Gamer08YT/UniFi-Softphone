module.exports = {
    packagerConfig: {
        icon: "./build/icon"
    },
    makers: [
        {
            name: '@electron-forge/maker-msix',
            sign: true,
            windowsKitPath: "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\x64",
            config: {
                packageAssets: 'D:\\Programmieren\\UniFiSoftphone\\build\\appx',
                manifestVariables: {
                    publisherDisplayName: 'BYTESTORE',
                    appDisplayName: "Unofficial UniFi Talk Softphone",
                    packageBackgroundColor: '#131517',
                    publisher: 'CN=555309DB-480B-42F6-B556-988555579009',
                    packageMinOSVersion: "10.0.26100.0",
                    packageName: "37017jaxnprivate.UnofficialUniFiTalkSoftphone",
                    packageIdentity: "37017jaxnprivate.UnofficialUniFiTalkSoftphone"
                }
            }
        }
    ]
};