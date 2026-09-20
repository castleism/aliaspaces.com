# AliaSpaces mobile app

Isolated from the `aliaspaces.com` GitHub Pages front door. The Android package
has two modes:

1. **Live (APK default)** — the real website at `https://mypersonas.online/`,
   same accounts and database. Automation studio, agent board, provider setup,
   and scheduled publishing controls are hidden in the app.
2. **Local demo** — device-only profiles/posts/reactions/reports/blocks. This
   mode still says local/demo and does not talk to the website.

## Live mode — what is real

- Sign in with the same AliaSpaces / MyPersonas account used on the website
  (email, password, magic link). Google may be blocked inside the WebView;
  use **Chrome** in the app bar if that happens. Chrome is a separate browser
  session, not a silent success inside the app.
- Persona discovery, pages, owner home, publication review, follows/friends,
  posts, albums, and other website social surfaces run in the live site.
- Cookies persist in the app WebView for that website origin.

## Live mode — what this is not

- Not a rewritten native client with its own API layer.
- Not a copy of the fused website into this repository.
- Not the automation platform. Matrix/studio, briefings, four-channel
  schedule, agent board, HQ assistant, composer, and provider setup stay on
  the website control plane and are hidden or redirected to Home.
- No production secrets. The app opens the public website.

## Local demo

Open `apps/social-mobile/index.html` or tap **Local** in the APK. Create two
local profiles, post, then block. Hidden content must disappear both ways.
Export/import JSON if a differently signed APK is installed beside this one.

## Tests

```bash
npm test
```

## Android debug package

Package id `com.aliaspaces.social.local` (same-key updates keep local demo
storage and live-site cookies).

```bash
apps/social-mobile/scripts/build-apk.sh
```

Writes `apps/social-mobile/dist/AliaSpaces-local-demo-debug.apk` and a copy
under `/opt/cursor/artifacts/` when present.

Store submission is owner-gated. Google Play is personal; submissions later.
