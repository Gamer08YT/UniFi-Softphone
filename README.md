# UniFi Softphone

Another little weekend project of mine.

Since the Talk Softphone is currently only available for paid memberships, here is my free2use version.

Unfortunately, there are no paid memberships available in countries outside the USA.

Contributions are welcome, maybe something nice will come of it :)

![img.png](img.png)

### Account Setup:

Create a new account on the UniFi Talk Server under [Devices](https://unifi/talk/phones/add-device).

![img_1.png](img_1.png)

**Please check if the SIP Server Hostname is the local IP of your UniFi Talk Server (theres an Bug, where Talk shows a
Hostname of an WAN Interface in the current version).**

If you use the DNS Server of your UniFi Controller, it should be fine to use ``unifi``.

### Function principle

The Client is using WebRTC to connect to the internal UniFi Talk SIP Server (based
on [FreeSwitch](https://developer.signalwire.com/freeswitch/FreeSWITCH-Explained/)).

I used the [SIP.js](https://sipjs.com/guides/server-configuration/freeswitch/) library to connect to the server.

If you want to use it externally, you need to forward port 5060 and 5066 which is very unsecure.

### See my other UniFi projects here:

https://gamer08yt.github.io/UniFi-Talk-Repo/

**This project is not affiliated with Ubiquiti in any way.**