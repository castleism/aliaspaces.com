# Milestone 2 — authenticated multi-user storage, authorization, and moderation

Milestone 1 is a **local/demo** device store. It does not authenticate, sync,
or moderate across users. This document is the concrete next milestone.

## Goal

Replace the device-only store with owner-authenticated, server-authorized
social records while keeping AliaSpaces inside its product boundary.

## In scope

1. **Identity**
   - Sign in through the shared Auth authority already used by MyPersonas.
   - Map one account to one or more personas through the versioned
     `identity-projection` contract (`account_id`, `persona_id`, `handle`,
     `lifecycle_state`).
   - Keep authentication/MFA configuration under one authority. Add explicit
     audience and origin checks for the AliaSpaces app id.
2. **Authorized storage**
   - Persist profiles, posts, reactions, reports, and blocks in the shared
     database under row-level security.
   - Every write is owner-scoped and fail-closed. The mobile client never
     sees a service-role key.
   - Symmetric blocks remain a server rule, not only a client filter.
3. **Moderation**
   - User reports create server records with reporter, target, reason, and
     a staff-visible state (`open`, `needs_review`, `resolved`).
   - A review queue is a separate authorized surface. Local milestone 1
     reports are not that queue.
   - Hidden-by-block and hidden-by-moderation are distinct states.
4. **Client honesty**
   - The app may say "signed in" only after a verified session.
   - Offline cache, if added, must still label unsynced local drafts.
   - Import of milestone 1 JSON is an explicit owner migration, not a silent
     network publish.

## Out of scope

- Store submission or production DNS/Pages cutover.
- Copying automation, billing, provider credentials, or AI routing.
- Auto-publishing native posts without the existing review/publish gates.
- Claiming the owner's existing phone-test prototypes as evidence.

## Acceptance checks

- Two unrelated accounts cannot read each other's private personas.
- A block created by either side hides posts, reactions, and profile
  projections for both sides on a fresh session.
- A report is visible to staff through an authorized queue and is not
  writable by the reported party.
- Revoking a session or entitlement unpublishes or hides exactly as the
  shared contract specifies.
- No milestone 1 "local demo" banner remains on a signed-in production
  build; a staging build may keep a staging banner.

## Suggested first slices

1. Read-only authenticated persona list against a staging projection.
2. Create-post RPC with owner and acting-persona checks.
3. Server-side block table + projection filters.
4. Report RPC + staff queue read model.
5. Migration notes for importing a milestone 1 export as an owner-owned
   draft set, never as other people's accounts.

## Owner gates

Production migrations, function deploys, provider credentials, and store
builds remain owner-confirmed. Agents may prepare code, tests, and staging
artifacts only.
