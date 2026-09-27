(() => {
  "use strict";

  const LIVE_HOSTS = Object.freeze([
    "mypersonas.online",
    "www.mypersonas.online",
    "aliaspaces.com",
    "www.aliaspaces.com",
  ]);
  const AUTH_HOSTS = Object.freeze([
    "nwsqyuucwzihruszocge.supabase.co",
    "accounts.google.com",
    "accounts.youtube.com",
    "appleid.apple.com",
  ]);
  const ASSET_HOSTS = Object.freeze([
    "cdn.jsdelivr.net",
    "cdnjs.cloudflare.com",
    "challenges.cloudflare.com",
    "www.youtube.com",
    "player.twitch.tv",
    "player.kick.com",
    "w.soundcloud.com",
    "appassets.androidplatform.net",
  ]);

  function hostOf(value) {
    const text = String(value || "");
    const match = text.match(/^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i);
    const host = (match ? match[1] : text.split("/")[0]).replace(/^\[|\]$/g, "").split(":")[0];
    return host.toLowerCase();
  }

  function isAllowedHost(value) {
    const host = hostOf(value);
    if (!host) return false;
    if (LIVE_HOSTS.includes(host) || AUTH_HOSTS.includes(host) || ASSET_HOSTS.includes(host)) return true;
    return host.endsWith(".supabase.co") || host.endsWith(".googleusercontent.com") || host.endsWith(".gstatic.com");
  }

  function isLiveProductHost(value) {
    return LIVE_HOSTS.includes(hostOf(value));
  }

  const api = { LIVE_HOSTS, AUTH_HOSTS, ASSET_HOSTS, hostOf, isAllowedHost, isLiveProductHost };

  const root = typeof globalThis !== "undefined" ? globalThis : undefined;
  if (root) root.AliaSpacesLiveHosts = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
