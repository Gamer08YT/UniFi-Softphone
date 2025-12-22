$cert = New-SelfSignedCertificate `
  -Type Custom `
  -Subject "555309DB-480B-42F6-B556-988555579009" `
  -KeyUsage DigitalSignature `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -FriendlyName "BYTESTORE MSIX" `
  -NotAfter (Get-Date).AddYears(5)

$pwd = ConvertTo-SecureString -String "password" -Force -AsPlainText

Export-PfxCertificate `
  -Cert $cert `
  -FilePath "BYTESTORE.pfx" `
  -Password $pwd

Import-PfxCertificate `
  -FilePath "BYTESTORE.pfx" `
  -CertStoreLocation "Cert:\CurrentUser\TrustedPeople" `
  -Password (ConvertTo-SecureString "password" -AsPlainText -Force)

& "C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe" sign /fd SHA256 /f "D:\Programmieren\UniFiSoftphone\BYTESTORE.pfx" /p "password" "UnofficialUniFiTalkSoftphone.msix"
msixherocli.exe sign --file D:\Programmieren\UniFiSoftphone\out\make\msix\x64\BYTESTORE.pfx --password <ihr-kennwort> --timestamp auto D:\Programmieren\UniFiSoftphone\out\make\msix\x64\UnofficialUniFiTalkSoftphone.msix