# Android origin and document isolation — 2026-09-27

Implemented locally on `codex/aliaspaces-roadmap-20260927`; no installation or deployment.

The former global `addJavascriptInterface` exposed native JSON document operations
to remote Website/Social pages and frames. It has been replaced by AndroidX's
origin-scoped WebMessage listener. The listener is registered only in Local mode,
removed on mode changes, and accepts messages only from the main frame of the
exact packaged Local document. Local and Social documents prohibit frames.
Unsupported WebViews receive no native bridge; browser file controls remain.

Main-frame navigation now validates HTTPS, exact product/auth hosts, port, and
absence of userinfo. CDN/media hosts and arbitrary Supabase subdomains are not
navigation destinations. Local mode cannot navigate onto the network. Assets
are intercepted only on the exact HTTPS asset origin.

File choosers are JSON-only in Local mode, image/video-only on product Website
pages, and unavailable on auth/Social pages. Pending results are discarded after
navigation or mode changes. Local JSON import/export is capped at 2 MiB. This is
a local/demo data transfer, not an online account backup.

Validation:

- 23 Node tests passed, including the front-door artifact boundary and bridge contract.
- 3 native JVM tests passed for exact origins, userinfo/scheme/port confusion,
  attacker Supabase/CDN hosts, mode separation, and MIME restrictions.
- `:app:testDebugUnitTest :app:assembleDebug` passed with the existing toolchain.
- APK SHA-256: `dc1d882fe7eb4bdb2a9d535a2fdc42e8dac447280eb1c2e5406982e824a6fa95`.
- Package remains `com.aliaspaces.social.local`, version code 3, `0.3.0-social`.
- Signing certificate SHA-256 `3679276f1b725252b376f200b51bd664e95fd71761b470d18118cf423521d855`
  matches the installed package pulled read-only on September 27.

Not verified: executing the new bridge on a physical device, live Google/MFA return,
or hosted unrelated-account privacy. The portfolio installation hold remains.
The APK is a debug candidate, not a store release. Server moderation and privacy
contracts remain separate from these native security controls.

Reference: [AndroidX WebViewCompat](https://developer.android.com/reference/androidx/webkit/WebViewCompat).
