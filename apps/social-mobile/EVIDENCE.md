# Mobile evidence (2026-09-25)

Owner phone-test prototypes are not in this checkout and are not claimed.
No ADB device and no self-hosted worker were connected to this run, so the
APK was not installed on a physical phone here. `scripts/install-on-phone.sh`
records that attempt.

## Unit and boundary

```bash
npm test
```

Covers front-door Pages allowlist, local block exclusion, exact-host
navigation, userinfo rejection, Local-only bridge, four launcher
activities, packaged PWA manifests/service worker/PNG icons, checker
targets, and fail-closed social client.

## Smokes

- `scripts/hub-smoke.mjs` — checker lists Web, Social, Local
- `scripts/live-client-smoke.mjs` — fixture social client
- `scripts/live-site-smoke.mjs` — live website shell
- `scripts/browser-smoke.mjs` — local demo blocks

## Android debug package

| Field | Value |
| --- | --- |
| Application id | `com.aliaspaces.social.local` |
| Launchers | AliaSpaces, AliaSpaces Web, AliaSpaces Social, AliaSpaces Local |
| Version | `0.5.0-pwa` (versionCode 5) |
| Signing | committed `android/debug.keystore` |
| Packaged PWAs | hub, Social, Local, persona (standalone + `sw.js`) |

## Websites that are not PWAs from this repo

- `aliaspaces.com` stays the five-file Pages redirect. A manifest or
  service worker there would change the public allowlist.
- `mypersonas.online` is a different origin. Chrome “Add to Home screen”
  needs an owner tap on that site. The APK **AliaSpaces Web** launcher is
  the installable website copy this package can ship.

## Not verified here

- Physical device install, Google OAuth, TOTP/MFA, or two-account privacy
- Auth dashboard URI changes
- Production SQL apply
- Store listing or submission
