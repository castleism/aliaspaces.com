# AliaSpaces website roadmap

Last reconciled: 2026-08-31 AKDT

## Current state

- `aliaspaces.com` is live as a transition page.
- `mypersonas.online` is the live persona-platform destination, but all 27
  database records currently marked for public visibility are nevertheless in
  an unpublished publication state and have empty linked-account arrays.
- AliaSpaces and MyPersonas have special rows in the Accounts workbook. Their
  exact canonical public account set still needs a current readback and owner
  verification.

## Dated plan

- **2026-09-02:** prepare the exact profile-by-profile republication brief.
- **2026-09-04:** confirm AliaSpaces/MyPersonas platform accounts, source owner,
  transition copy, and destination links.
- **2026-09-11:** audit the first owner-approved profile/link batch, if one was
  authorized; otherwise record the next approval date.
- **2026-09-30:** review whether the transition page still reflects the current
  platform roadmap and whether a dated product/update entry is warranted.

Profile publication and account linking require approval of the exact
destination, copy, media, placement, visibility, disclosures, and time zone.
No transition or provider action is authorized by this roadmap.

## Changelog

### 2026-09-26 — roadmap sweep

- Front-door tests re-run: 2/2 pass. No code changes were needed.
- Correction: commit `401480c` ("make the public site installable on a
  phone") only added this roadmap file. `main` has no manifest or service
  worker, and `https://aliaspaces.com/manifest.webmanifest` returns 404.
- PWA work is intentionally not done here. The live page is a `noindex`
  redirect to `mypersonas.online`, its CSP is `default-src 'none'` (which
  also blocks a manifest), and the Pages artifact is a tested five-file
  boundary. An installed app would only redirect. The installable app
  belongs on `mypersonas.online`.

## Blocked (owner input needed)

| Item | What's needed |
| --- | --- |
| 2026-09-02 republication brief | Owner-approved persona fields, disclosures, media, destinations, visibility |
| 2026-09-04 account confirmation | Readback of the Accounts workbook and owner verification |
| 2026-09-11 first profile batch audit | An owner-approved batch to audit |
| 2026-09-30 transition-page review | Not due yet; needs the current platform roadmap decision |
| Redirect vs. full AliaSpaces home | Owner decision; DNS, Pages allowlist, and deploy each need approval |
| PWA / installable site | Depends on the decision above; needs a CSP and artifact-boundary change |
| Branch protection and Pages reviewer | Owner to change GitHub repository settings |
| Android WebView bridge fix (PR #1) | Coordination with the mobile sprint; physical devices and two MFA staging accounts |

