module.exports = {
    packagerConfig: {
        icon: "./build/icon"
    },
    makers: [
        {
            name: '@electron-forge/maker-msix',
            sign: true,
            config: {
                packageAssets: 'D:\\Programmieren\\UniFiSoftphone\\build\\appx',
                manifestVariables: {
                    publisherDisplayName: 'Jan Heil (www.byte-store.de)',
                    appDisplayName: "Unofficial UniFi Talk Softphone",
                    packageBackgroundColor: '#131517',
                    publisher: 'CN=555309DB-480B-42F6-B556-988555579009'
                }
            }
        }
    ]
};