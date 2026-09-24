# Auth redirect URIs for the AliaSpaces mobile clients

Do **not** change the Auth dashboard from this checkout. These are the exact
return URLs to add when the owner is ready. Email/password already works
without them. Magic-link and Google do not return into the app until these
exist.

## Audience

- App id / audience: `aliaspaces-social-mobile`
- Existing website origin remains the primary Auth client.

## Redirect URIs to add (owner dashboard)

```
https://mypersonas.online/
https://mypersonas.online/**
https://www.mypersonas.online/
https://appassets.androidplatform.net/assets/www/live.html
aliaspaces://social
aliaspaces://website
```

## Not claimed

- Google WebView success without these URIs
- Custom scheme HTTPS App Links verification (`assetlinks.json` on the
  live origin is a separate website change)
- Changing the production Auth site URL or disabling the website client
