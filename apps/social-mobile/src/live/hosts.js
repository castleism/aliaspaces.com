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

  function hasUserInfo(value) {
    const text = String(value || "");
    const match = text.match(/^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i);
    return !!(match && match[1].includes("@"));
  }

  function isHttpsUrl(value) {
    return /^https:\/\//i.test(String(value || ""));
  }

  function isAllowedHost(value) {
    if (!isHttpsUrl(value) || hasUserInfo(value)) return false;
    const host = hostOf(value);
    if (!host) return false;
    return LIVE_HOSTS.includes(host) || AUTH_HOSTS.includes(host) || ASSET_HOSTS.includes(host);
  }

  function isLiveProductHost(value) {
    if (!isHttpsUrl(value) || hasUserInfo(value)) return false;
    return LIVE_HOSTS.includes(hostOf(value));
  }

  function isLocalAssetUrl(value) {
    if (!isHttpsUrl(value) || hasUserInfo(value)) return false;
    return hostOf(value) === "appassets.androidplatform.net";
  }

  const api = {
    LIVE_HOSTS,
    AUTH_HOSTS,
    ASSET_HOSTS,
    hostOf,
    hasUserInfo,
    isHttpsUrl,
    isAllowedHost,
    isLiveProductHost,
    isLocalAssetUrl,
  };

  const root = typeof globalThis !== "undefined" ? globalThis : undefined;
  if (root) root.AliaSpacesLiveHosts = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
