# AliaSpaces mobile app

Isolated from the `aliaspaces.com` GitHub Pages front door. One debug APK
installs **four home-screen apps**:

1. **AliaSpaces** — checker of every site/app to review.
2. **AliaSpaces Web** — standalone browser app for
   `https://mypersonas.online/`. Same live accounts and cookies. No local
   JavaScript bridge.
3. **AliaSpaces Social** — first-party social client.
4. **AliaSpaces Local** — device-only demo.

Packaged hub / Social / Local / persona pages also ship as standalone PWAs
(web manifest, same-origin service worker, 192/512 PNG icons). The public
`aliaspaces.com` front door is not a PWA. A Chrome PWA of
`mypersonas.online` needs an owner tap on that origin.

Long-press the AliaSpaces icon for Web / Social / Local shortcuts. The first
launch may also offer to pin AliaSpaces Web.

## What to check

Open **Check** (the default). It lists:

- AliaSpaces Web (live website browser app)
- Front door `aliaspaces.com`
- First-party Social
- Local demo
- Public persona lookup
- Draft pull request (Chrome)

## Security boundary

- `AliaSpacesAndroid` is attached only while Local demo is showing and is
  removed when leaving that mode.
- Main-frame navigation is an exact host allowlist. Attacker-controlled
  `*.supabase.co` hosts, userinfo URLs, and http navigations are rejected.
- Local file chooser accepts JSON only. Website/Social accept images only.

## Tests

```bash
npm test
```

```bash
node apps/social-mobile/scripts/hub-smoke.mjs
node apps/social-mobile/scripts/live-client-smoke.mjs
```

## Android debug package

Package id `com.aliaspaces.social.local`, version `0.5.0-pwa`.

```bash
apps/social-mobile/scripts/build-apk.sh
apps/social-mobile/scripts/install-on-phone.sh
```

Same-key `adb install -r` keeps local demo data and website cookies.
This cloud checkout cannot reach the owner's phone. Follow
`docs/PHONE-CHECKLIST.md` after install.

Store submission is owner-gated.
