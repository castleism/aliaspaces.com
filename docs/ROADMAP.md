# AliaSpaces roadmap

This repository is the AliaSpaces product home. `main` still publishes only
the four-file HTTPS front door that redirects `aliaspaces.com` to
`https://mypersonas.online`. Application work lives in separate directories
and is not part of that Pages artifact.

The combined MyPersonas/AliaSpaces historical roadmap remains in the
MyPersonas repository. This file records **verified work in this checkout**
and the next AliaSpaces-owned milestones.

## Verified in this checkout (2026-09-20)

### Front door (unchanged)

- [x] `index.html`, `404.html`, `CNAME`, and `.nojekyll` remain the public
      Pages allowlist. Path, query, and hash are preserved on redirect.
- [x] No analytics, cookies, forms, or application data on the public site.
- [x] This branch does not merge, deploy, publish to stores, change account
      permissions, or start paid services.

### Milestone 1 — isolated local social mobile surface

Status: **implemented and locally verified in this cloud checkout**. Existing
phone-test prototypes mentioned by the owner are **not present here** and are
not claimed.

- [x] Isolated app at `apps/social-mobile/`, separate from the front door.
- [x] Persistent local profiles, posts, reactions, reports, and blocks.
- [x] Symmetric block rules exclude hidden profiles, posts, reactions, and
      reports from every viewer query. Covered by `npm test`.
- [x] UI and docs label the prototype **local/demo**. No fake online users
      and no network success path (`connect-src 'none'`, no `fetch`).
- [x] Demo fixtures are explicit `source: fixture` records, separate from
      user-created records.
- [x] Export/import JSON for data preservation when Android signing differs.
- [x] Reproducible Android debug build via
      `apps/social-mobile/scripts/build-apk.sh`.
- [x] Installable Android debug APK built in this environment when the
      Android SDK can be installed. See the PR and
      `apps/social-mobile/README.md` for the artifact path and signing note.

Browser smoke (this agent): create two local profiles, post, react, report,
block, confirm the blocked author disappears from both feeds, export JSON.
This is not signed-in real-phone QA and does not use the owner's local
phone-test builds.

## Next milestones

1. **Milestone 2 — authenticated multi-user storage, authorization, and
   moderation.** Concrete contract:
   [docs/MOBILE-MILESTONE-2.md](MOBILE-MILESTONE-2.md).
2. **Public read-only persona page** consuming a versioned public projection
   with opaque media identifiers (from the extraction plan on
   `split/social-platform-20260824`).
3. **Signed-in identity shell** over the shared Auth authority, with audience
   and origin checks. Not a copy of the fused MyPersonas page.
4. **PWA / origin identity** after staging gates, still without changing the
   live redirect until cutover is approved.

## Concrete blockers

- Shared Auth, entitlement, media, and moderation services are still owned
  by the MyPersonas production authority. This repo must consume versioned
  contracts, not copy privileged implementations.
- No production database, Edge Function, OAuth callback, DNS, or Pages
  allowlist change is authorized from this mobile milestone.
- Real-device Android/iOS install proof is owner-gated. This cloud checkout
  does not have the owner's existing phone prototypes.
- Store listings and submissions wait for a later owner pass. Both store
  accounts are recorded as verified; Google is personal; do not submit.
- Two-account privacy, MFA recovery, and live moderation staffing are
  milestone 2+ gates, not implied by local persistence.
