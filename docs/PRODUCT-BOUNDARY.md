# AliaSpaces product boundary

**Status:** extraction control, not production approval
**Branch:** `split/social-platform-20260824`

## AliaSpaces owns

- Persona and business page presentation, custom fields, widgets, layout, and
  image placement.
- Public discovery, persona search, feeds, posts, albums, comments, reactions,
  and first-party moderation presentation.
- Persona follows, friendship requests, blocks, mutes, family links, backups,
  projects, business roles, and persona-perspective interaction.
- Page publication review, social visibility, field visibility, attached social
  handle presentation, public affiliate offers, and review-request forms.
- Social PWA identity, navigation, metadata, cache namespace, and the
  `aliaspaces.com` public origin after cutover.

## AliaSpaces does not own

- External-provider secrets, token refresh, mailboxes, or automated posting.
- AI provider routing, model budgets, task runners, research briefs, or private
  persona source libraries.
- Stripe webhooks, subscription remediation, refunds, or staff billing tools.
- Global administrator security operations, provider-wide incident response,
  or the current production database migration runner.
- The stable media gateway implementation while it remains the shared platform
  authority.

## Shared contracts

Authentication/MFA, canonical account and persona identifiers, entitlements,
media ingest, provenance, audit events, and account export/deletion are shared
contracts. AliaSpaces consumes the narrow projections in
`contracts/shared-platform.v1.json`; it does not copy their privileged
implementations.

Every shared interface must be versioned, authenticated, owner scoped, and
fail closed. No Edge Function or migration may have two deployment owners.
