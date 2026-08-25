# Social application extraction plan

This plan keeps the live redirect on `main` until an independently testable
AliaSpaces staging candidate exists. A completed source copy is not by itself a
release.

## Current checkpoint

- [x] Create a non-deploying split branch from the live redirect commit.
- [x] Preserve the root redirect and restrict its Pages workflow to `main`.
- [x] Define product ownership and shared-contract boundaries.
- [x] Extract the independent profile-image crop component with tests.
- [x] Add a CI check that rejects known automation/control-plane code.
- [ ] Extract a dedicated social app shell; do not copy the fused transitional
      page as the final application.

## Next extraction slices

1. **Public read-only persona page.** Build a clean route that consumes a
   versioned public persona projection with opaque media identifiers. Include
   custom fields, family/backups, business roles, layout, and full-image
   previews without owner UUIDs in public URLs.
2. **Signed-in identity shell.** Connect the shared Supabase Auth session while
   keeping authentication/MFA configuration under one authority. Add explicit
   audience and origin checks for both product domains.
3. **Persona perspective.** Extract overview/persona switching, follow and
   friendship operations, blocks/mutes, and the two-account privacy matrix.
   The existing persona-view script is too coupled to global transitional state
   to copy safely; decompose it behind typed adapters first.
4. **Page editor.** Extract profile layout, custom fields, widgets, connected
   family/business/project sections, media previews, and publication review.
   Split social controls from staff, billing, security, and automation controls.
5. **Native social content.** Extract posts, albums, comments, reactions,
   affiliate disclosures, review requests, and fan-session presentation. AI
   inference remains a separately authenticated service contract.
6. **PWA and origin identity.** Give AliaSpaces its own manifest, icons, cache
   namespace, canonical metadata, sitemap, robots policy, and offline shell.
7. **Database/function handoff.** Keep historical migrations in the existing
   ledger. Place new social SQL in `supabase/migration-candidates/` for review by
   the single migration authority. Add only functions on the approved
   AliaSpaces allowlist, with CI rejecting duplicates.

## Required staging gates

- Signed-in mobile tests on current iOS Safari and Android Chrome.
- Two separate accounts verify private/unlisted/public pages, field visibility,
  follow/friend verification policy, blocks/mutes, and cross-owner asset access.
- MFA enrollment, recovery, session revocation, SSO return paths, and account
  deletion are verified across both origins.
- Public media routes expose no stable owner UUID, storage path, signed private
  URL, or cross-owner cache artifact.
- Entitlement loss unpublishes social pages exactly once; restoration does not
  silently republish them.
- CAPTCHA, WAF, rate limiting, SMTP, operational alerts, and provider callback
  allowlists include the staging origin before public cutover.
- Accessibility, keyboard crop controls, reduced motion, offline behavior,
  browser console, and responsive layouts pass.

## Cutover and rollback

Record immutable MyPersonas and AliaSpaces candidate SHAs. Deploy AliaSpaces to
staging first, complete every gate, then approve the production Pages artifact
and domain change separately. Preserve the four-file redirect artifact so
rollback restores routing without reversing a database migration or deleting
data.
