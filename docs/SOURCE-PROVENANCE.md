# Source provenance

The extraction branch starts from AliaSpaces redirect commit
`f546fa104584f19c34fee3e6ecceb86fb5579a57`.

The first social component was extracted from the canonical MyPersonas
integration worktree at commit
`c6e6ce2ee625f99782508ca7de8578143a259048` on 2026-08-24:

| Source path | Source SHA-256 | Extracted path | Deliberate change |
| --- | --- | --- | --- |
| `MyPersonas.Online_v0/profile-image-crop.js` | `28079B4E6ADCC4631682764E6A71482CC5861A46CED416634A3F2DF16925B2DD` | `apps/social-web/src/components/profile-image-crop.js` | Public browser namespace renamed from the transitional product name to `AliaSpacesProfileCrop`. |
| `MyPersonas.Online_v0/profile-image-crop.css` | `C47821230CEF7A6994F471280D9460E801C037A94DC3FE7E4662DC6FE063833C` | `apps/social-web/src/components/profile-image-crop.css` | None. |

No fused `index.html`, automation worker, provider function, billing code,
credential handling, database migration, production data, or private media was
copied. The workbench and tests were authored in this repository around the
extracted component.
