# aliaspaces.com migration front door

This public GitHub Pages site gives `aliaspaces.com` and `www.aliaspaces.com` a
valid HTTPS endpoint while the application remains canonical at
`https://mypersonas.online`.

`index.html` and `404.html` preserve the incoming path, query, and hash when
redirecting. No analytics, cookies, forms, credentials, or private application
data are present here. The Pages workflow publishes only the four explicit
public files.

The isolated local/demo social mobile prototype lives in
`apps/social-mobile/` and is not part of the Pages artifact. See
`docs/ROADMAP.md` and `AGENTS.md`.
