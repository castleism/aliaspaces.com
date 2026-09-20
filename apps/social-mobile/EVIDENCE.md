# Mobile evidence (2026-09-20)

Owner phone-test prototypes are not in this checkout and are not claimed.

## Unit and boundary

```bash
npm test
```

Covers local block exclusion, local/demo honesty, live host allowlist,
automation-route redirects, first-party fail-closed client, Android
Website/Social/Local wiring, deep links, and Pages boundary.

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

## First-party social client smoke

`node apps/social-mobile/scripts/live-client-smoke.mjs`

- `live.html?demo=1` uses the fixture transport, not production
- Signed-in is claimed only after fixture Auth succeeds
- Block hides the other fixture author's post
- `save_persona_post` is labeled review-gated / not auto-published
- Screenshots: `aliaspaces-social-client-signed-out.png`,
  `aliaspaces-social-client-after-block.png`

Read-only live check (no writes): anonymous `my_personas` is HTTP 401.

## Android debug package

`apps/social-mobile/scripts/build-apk.sh`

| Field | Value |
| --- | --- |
| Application id | `com.aliaspaces.social.local` |
| Label | AliaSpaces |
| Version | `0.3.0-social` (versionCode 3) |
| Default mode | Website `https://mypersonas.online/` |
| Other modes | First-party Social, Local demo |
| Internet permission | required for Website/Social |
| Signing | committed `android/debug.keystore` |

Install with the same key (`adb install -r`) to keep local demo data and
website cookies. A differently signed APK installs beside this one.

## Not verified here

- Physical device Google OAuth, TOTP/MFA, or two-account privacy
- Store listing or submission
- Production content-report RPC or staff queue
- Server-side block projections (client filter only)
