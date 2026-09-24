# Phone checklist (owner install)

This cloud checkout has no ADB device and no self-hosted worker, so the APK
cannot be pushed onto the owner's phone from here. After `adb install -r`
of `AliaSpaces-social-debug.apk` / `AliaSpaces-local-demo-debug.apk`:

1. Confirm two launcher icons: **AliaSpaces** (checker + Social + Local) and
   **AliaSpaces Web** (live website browser app).
2. If Android asks to add **AliaSpaces Web** to the home screen, accept.
3. Open **AliaSpaces Web**. Sign in with email/password on the live site.
   Use Chrome inside that app if Google is blocked. Do not treat a failed
   Google WebView login as success.
4. Open **AliaSpaces** → Check. Every site/app to review is listed there.
5. Open Social and Local from the checker or the app bar.
6. Owner-only still: MFA, a second unrelated account, Auth dashboard URIs,
   applying `docs/migrations/*.sql`, merge, Pages deploy, store submit.
