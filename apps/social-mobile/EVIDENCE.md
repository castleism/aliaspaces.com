# Mobile evidence (2026-09-24)

Owner phone-test prototypes are not in this checkout and are not claimed.
No ADB device and no self-hosted worker were connected to this run, so the
APK was not installed on a physical phone here.

## Unit and boundary

```bash
npm test
```

Covers front-door Pages allowlist, local block exclusion, exact-host
navigation, userinfo rejection, Local-only bridge, two launcher activities,
checker targets, and fail-closed social client.

## Smokes

- `scripts/hub-smoke.mjs` — checker lists Web, Social, Local
- `scripts/live-client-smoke.mjs` — fixture social client
- `scripts/live-site-smoke.mjs` — live website shell
- `scripts/browser-smoke.mjs` — local demo blocks

## Android debug package

| Field | Value |
| --- | --- |
| Application id | `com.aliaspaces.social.local` |
| Launchers | AliaSpaces, AliaSpaces Web |
| Version | `0.4.0-check` (versionCode 4) |
| Signing | committed `android/debug.keystore` |

## Not verified here

- Physical device install, Google OAuth, TOTP/MFA, or two-account privacy
- Auth dashboard URI changes
- Production SQL apply
- Store listing or submission
