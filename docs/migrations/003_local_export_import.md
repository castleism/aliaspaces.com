# Milestone 1 export → owner drafts (not applied)

A local-demo JSON export (`aliaspaces.social.local`) is **not** a network
publish and must not create other people's accounts.

Owner-confirmed import, when a staging projection exists:

1. Sign in as the destination account.
2. Choose an owned persona from `my_personas`.
3. Map each `source: user` local post to `save_persona_post` for that
   persona only.
4. Keep fixture records out of the import.
5. Leave every imported post in the existing review/publish gate.
6. Do not create personas, blocks, or reports for handles that belong to
   someone else.

This file is a procedure note. The mobile client still refuses to treat a
local import as a live publish.
