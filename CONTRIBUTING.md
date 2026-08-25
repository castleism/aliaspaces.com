# Contributing

Keep each change inside the AliaSpaces social boundary. A pull request must say
which product owns the capability, which shared contract it consumes, which
repository deploys it, and how rollback works.

Before committing:

1. Run `npm test`.
2. Confirm no credential, private media, account export, or production data is
   present.
3. Confirm the Pages artifact allowlist still excludes `apps/`, `contracts/`,
   `docs/`, `scripts/`, and `supabase/`.
4. Keep migration candidates non-deploying until the single shared migration
   authority accepts them.
5. Do not copy a mixed or automation-owned function into this repository.

Use descriptive commits such as `feat(profile): extract image crop component`
or `docs(split): define the social identity contract`. Do not merge the split
branch into `main` until the staging and two-account privacy gates in the
extraction plan are complete.
