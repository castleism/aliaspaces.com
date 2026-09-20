# Milestone 1 evidence (2026-09-20)

This file records what this cloud checkout actually verified. It does not
claim the owner's existing phone-test prototypes.

## Unit and boundary

```bash
npm test
```

6/6 Node tests passed, including symmetric block exclusion and import
honesty. The Pages allowlist still excludes `apps/`.

## Browser smoke

`node apps/social-mobile/scripts/browser-smoke.mjs` (Playwright Chromium,
390×844):

1. Empty state shows the local/demo banner.
2. `smoke_north` and `smoke_south` each create a local post.
3. South blocks North. South's feed keeps only the South post.
4. Switching back to North through **You** keeps only the North post.

Screenshots from that run:

- `/opt/cursor/artifacts/aliaspaces-local-demo-banner.png`
- `/opt/cursor/artifacts/aliaspaces-local-south-feed.png`
- `/opt/cursor/artifacts/aliaspaces-local-feed-after-block.png`

## Android debug package

```bash
apps/social-mobile/scripts/build-apk.sh
```

Verified with `apksigner verify` (v2) and `aapt dump badging`:

| Field | Value |
| --- | --- |
| Application id | `com.aliaspaces.social.local` |
| Label | AliaSpaces Local Demo |
| Version | `0.1.0-local-demo` (versionCode 1) |
| minSdk / targetSdk | 24 / 34 |
| Internet permission | absent |
| Signing | committed `android/debug.keystore`, alias `aliaspaceslocal` |
| Artifact | `/opt/cursor/artifacts/AliaSpaces-local-demo-debug.apk` |

Install with the same key to keep local storage (`adb install -r`). A
differently signed package installs beside this one; export/import JSON
to move data.

## Not verified here

- Physical Android or iOS device
- Owner's existing local phone prototypes
- Store listing or submission
- Authenticated multi-user storage (milestone 2)
