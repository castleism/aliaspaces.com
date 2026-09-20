# Mobile evidence (2026-09-20)

Owner phone-test prototypes are not in this checkout and are not claimed.

## Unit and boundary

```bash
npm test
```

Covers local block exclusion, local/demo honesty, live host allowlist,
automation-route redirects, and Android Live/Local wiring.

## Local demo smoke

`node apps/social-mobile/scripts/browser-smoke.mjs`

- Local/demo banner
- Two device profiles, posts, symmetric block

## Live website smoke

`node apps/social-mobile/scripts/live-site-smoke.mjs`

- `https://mypersonas.online/` returns AliaSpaces
- Injected social shell hides Matrix/studio and redirects `#/studio`
- Sign-in control remains
- Screenshots: `aliaspaces-live-website-before-shell.png`,
  `aliaspaces-live-website-social-shell.png`

This proves the live site is reachable and the app shell can hide
automation. It is not a signed-in real-phone session.

## Android debug package

`apps/social-mobile/scripts/build-apk.sh`

| Field | Value |
| --- | --- |
| Application id | `com.aliaspaces.social.local` |
| Label | AliaSpaces |
| Version | `0.2.0-live` (versionCode 2) |
| Default mode | Live website `https://mypersonas.online/` |
| Other mode | Local demo assets |
| Internet permission | required for live mode |
| Signing | committed `android/debug.keystore` |

Install with the same key (`adb install -r`) to keep local demo data and
website cookies. A differently signed APK installs beside this one.

## Not verified here

- Physical device Google OAuth, TOTP/MFA, or two-account privacy
- Store listing or submission
- A native client that is not the live website WebView
