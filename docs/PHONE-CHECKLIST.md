# Phone checklist (owner install)

This cloud checkout has no ADB device and no self-hosted worker, so the APK
cannot be pushed onto the owner's phone from here. After `adb install -r`
of `AliaSpaces-social-debug.apk` / `AliaSpaces-local-demo-debug.apk`
(version `0.5.0-pwa`):

1. Confirm four launcher icons: **AliaSpaces** (checker), **AliaSpaces Web**
   (live website browser app), **AliaSpaces Social**, and **AliaSpaces Local**.
2. If Android asks to add **AliaSpaces Web** to the home screen, accept.
3. Open **AliaSpaces Web**. Sign in with email/password on the live site.
   Use Chrome inside that app if Google is blocked. Do not treat a failed
   Google WebView login as success.
4. Optional Chrome PWA: on the phone, open `https://mypersonas.online/` in
   Chrome → **Add to Home screen**. This checkout cannot tap Chrome on the
   live origin. `aliaspaces.com` stays a five-file redirect and is not a PWA.
5. Open **AliaSpaces** → Check. Every site/app to review is listed there.
6. Open Social and Local from their launchers, the checker, or the app bar.
7. Owner-only still: MFA, a second unrelated account, Auth dashboard URIs,
   applying `docs/migrations/*.sql`, merge, Pages deploy, store submit.
