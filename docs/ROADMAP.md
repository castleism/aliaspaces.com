# AliaSpaces roadmap

This repository is the AliaSpaces product home. `main` publishes the five-file
HTTPS front door that redirects `aliaspaces.com` to
`https://mypersonas.online`. Application work lives in separate directories
and is not part of that Pages artifact.

See also [PROJECT-BOUNDARY.md](../PROJECT-BOUNDARY.md) and
[ROADMAP-PROGRESS-2026-09-24.md](../ROADMAP-PROGRESS-2026-09-24.md).

## Verified in this checkout (2026-09-24)

### Front door (from `main`)

- [x] `index.html`, `404.html`, `favicon.svg`, `CNAME`, and `.nojekyll` are
      the public Pages allowlist. Path, query, and hash are preserved.
- [x] No analytics, cookies, forms, or application data on the public site.
- [x] This branch does not merge, deploy, publish to stores, change account
      permissions, or start paid services.

### Milestone 1–2 client slices

- [x] Isolated app at `apps/social-mobile/`.
- [x] Local demo with symmetric blocks, honest labeling, export/import.
- [x] First-party Social client, fail-closed, review-gated posts.
- [x] Website browser app is a **separate launcher** with no JS bridge.
- [x] Checker hub lists every site/app to review.
- [x] Bridge exists only for Local/demo. Exact-host navigation. Narrow MIME.
- [x] Read-only public persona lookup in the APK (not on Pages).
- [x] Auth redirect URI list and block/report SQL prepared, not applied.
- [x] Debug APK `0.4.0-check` (versionCode 4), same package and keystore.

## Remaining owner-gated work

1. Install the APK on a physical phone (`docs/PHONE-CHECKLIST.md`). This
   cloud agent has no ADB device and no self-hosted worker.
2. MFA and two-unrelated-account privacy on that phone.
3. Add the redirect URIs in [AUTH-REDIRECTS.md](AUTH-REDIRECTS.md) in the
   Auth dashboard.
4. Apply [migrations](migrations/README.md) from the MyPersonas authority.
5. Merge, Pages deploy, store listing/submission.
6. Versioned opaque-media contract, then a Pages cutover if approved.
7. iOS / store signing.
