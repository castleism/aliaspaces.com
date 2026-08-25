# Non-deploying social migration candidates

This directory is a review queue, not a migration runner. Historical migrations
remain in the existing shared ledger and must never be replayed from AliaSpaces.

A candidate must declare its logical owner, dependencies, rollback/forward-fix
plan, RLS policies, repeat-apply behavior, and the shared migration release that
will absorb it. Nothing in this directory may be applied automatically by an
AliaSpaces workflow while the products share a database authority.
