# AliaSpaces

AliaSpaces is the first-party social product for presenting, discovering, and
interacting through owner-controlled personas. This repository is being
separated from the MyPersonas automation control plane.

## Current release state

- `main` remains the production rollback branch. Its four-file GitHub Pages
  artifact redirects `aliaspaces.com` to the current combined application at
  `https://mypersonas.online`.
- `split/social-platform-20260824` is a non-deploying extraction branch. It
  contains the first independently usable social component and the controls
  needed to continue the split safely.
- No database migration, Edge Function, OAuth callback, DNS record, or public
  route is changed by the extraction branch.

The Pages workflow is restricted to `main` and publishes only `index.html`,
`404.html`, `CNAME`, and `.nojekyll`. Application source under `apps/` is not
part of that artifact.

## Product ownership

AliaSpaces owns persona pages, page layout and image presentation, social
discovery and feeds, posts and albums, follows and friendships, family and
backup relationships, business/project presentation, publication review,
persona-perspective interaction, fan-facing chat presentation, and public
social media experiences.

MyPersonas continues to own external-provider credentials, automation workers,
AI routing and budgets, private research/source libraries, billing internals,
staff operations, and the shared production migration authority during the
transition. See [the product boundary](docs/PRODUCT-BOUNDARY.md) and [the
extraction plan](docs/EXTRACTION-PLAN.md).

## Work locally

The first extracted component is the persona image cropper. Open
`apps/social-web/index.html` in a modern browser to try it without an account,
network request, or backend. Run `npm test` from the repository root to execute
the component and boundary checks.
