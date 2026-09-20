# AliaSpaces local social mobile prototype

Isolated first-milestone surface for the AliaSpaces social product. It is a
**local demo**: profiles, posts, reactions, reports, and blocks persist on the
device only. The UI says this plainly. There are no online users and no
network success path.

This directory is not part of the `aliaspaces.com` GitHub Pages front door.

## What is real in this milestone

- Create and switch local profiles (device personas, not accounts).
- Persist posts, reactions, reports, and blocks in `localStorage`.
- Exclude blocked content from feed, profile lists, reactions, and reports
  for **both** sides of a block.
- Export and import a versioned JSON bundle so a differently signed Android
  install can be tested side-by-side or restored manually.
- Optional **demo fixtures** labeled `source: fixture`. They are generated on
  the device and are not fake online users.

## What is not real

- No authentication, no multi-device sync, no live moderation queue.
- No fetch, WebSocket, or upload.
- Installing a differently signed APK creates a separate Android app identity
  and does not inherit storage. Use export/import.

## Run in a browser

Open `apps/social-mobile/index.html` in a current browser, or from the
repository root:

```bash
npx --yes serve apps/social-mobile
```

Create two local profiles, post as each, then block one from the other. The
blocked author's posts and reactions must disappear for both profiles.

## Tests

From the repository root:

```bash
npm test
```

Or only this app:

```bash
node --test apps/social-mobile/tests/*.test.mjs
```

## Android debug package

The package id is `com.aliaspaces.social.local`. The committed debug keystore
keeps the same signature across rebuilds on this branch so updates can keep
local data.

```bash
apps/social-mobile/scripts/build-apk.sh
```

The script writes:

- `apps/social-mobile/dist/AliaSpaces-local-demo-debug.apk`
- a copy under `/opt/cursor/artifacts/` when that directory exists

Install with `adb install -r` using the same signing key to preserve data.
If a phone already has a differently signed prototype, keep that install
installed and use export/import instead of overwriting it.

Store submission is out of scope. Google Play (personal) and the later
submission pass are owner-gated.

## Next milestone

See [docs/MOBILE-MILESTONE-2.md](../../docs/MOBILE-MILESTONE-2.md) for
authenticated multi-user storage, authorization, and moderation.
