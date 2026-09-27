(() => {
  "use strict";

  const LIVE_ORIGIN = "https://mypersonas.online";
  const AUTOMATION_ROUTES = Object.freeze([
    "studio",
    "briefs",
    "schedule",
    "agent-board",
    "platform-queue",
    "fan-inbox",
    "business-settings",
  ]);
  const AUTOMATION_FILES = Object.freeze([
    "provider-setup.html",
  ]);
  const HIDE_SELECTORS = Object.freeze([
    "[data-overview-nav]",
    "button[onclick*=\"go('studio')\"]",
    "button[onclick*=\"go('briefs')\"]",
    "button[onclick*=\"go('schedule')\"]",
    "button[onclick*=\"go('discovery')\"]",
    "button[onclick*=\"go('agent-board')\"]",
    "button[onclick*=\"siteGo('studio')\"]",
    "button[onclick*=\"siteGo('briefs')\"]",
    "button[onclick*=\"siteGo('schedule')\"]",
    "button[onclick*=\"siteGo('discovery')\"]",
    "button[onclick*=\"siteGo('agent-board')\"]",
    "button[onclick*=\"siteGo('platform-queue')\"]",
    "button[onclick*=\"ownerAppMobileGo('agent-board')\"]",
    "button[onclick*=\"ownerAppMobileHQ\"]",
    "button[onclick*=\"openHQ(\"]",
    "button[onclick*=\"openComposer(\"]",
    "button[onclick*=\"ownerAppMobileChat(\"]",
    "button[onclick*=\"siteGo('fan-inbox')\"]",
    "button[onclick*=\"siteGo('business-settings')\"]",
    "button[onclick*=\"go('fan-inbox')\"]",
    "a[href*='provider-setup.html']",
    "#sdPanel",
    "[data-view='briefs']",
    "[data-view='schedule']",
  ]);

  function routeName(hash) {
    return String(hash || "").replace(/^#\/?/, "").split("/")[0];
  }

  function isAutomationRoute(hash) {
    return AUTOMATION_ROUTES.includes(routeName(hash));
  }

  function isAutomationFile(pathname) {
    const name = String(pathname || "").split("/").pop();
    return AUTOMATION_FILES.includes(name);
  }

  function socialLanding() {
    return `${LIVE_ORIGIN}/`;
  }

  function apply(doc = typeof document !== "undefined" ? document : null, loc = typeof location !== "undefined" ? location : null) {
    if (!doc) return { hidden: 0, redirected: false };
    let hidden = 0;
    for (const selector of HIDE_SELECTORS) {
      const nodes = doc.querySelectorAll(selector);
      for (const node of nodes) {
        if (node.getAttribute("data-aliaspaces-live") === "kept") continue;
        node.setAttribute("hidden", "hidden");
        node.setAttribute("data-aliaspaces-hidden", "automation");
        if (node.style) node.style.display = "none";
        hidden += 1;
      }
    }
    let banner = doc.getElementById("aliaspacesLiveBanner");
    if (!banner && doc.body) {
      banner = doc.createElement("details");
      banner.id = "aliaspacesLiveBanner";
      banner.textContent = "Live AliaSpaces website — same accounts and database as mypersonas.online. Automation studio, provider setup, and agent tools stay on the website control plane and are hidden in this app.";
      const summary = doc.createElement("summary");
      summary.textContent = "About your shared account";
      banner.insertBefore(summary, banner.firstChild);
      banner.style.cssText = "margin:0;padding:10px 14px;background:#efe9ff;color:#3b2c73;font:600 13px/1.4 Inter,system-ui,sans-serif;border-bottom:1px solid #d7c8ff";
      doc.body.insertBefore(banner, doc.body.firstChild);
    }
    let redirected = false;
    if (loc && (isAutomationRoute(loc.hash) || isAutomationFile(loc.pathname))) {
      loc.hash = "#/owner";
      redirected = true;
    }
    return { hidden, redirected, mode: "live-website" };
  }

  function watch(doc = typeof document !== "undefined" ? document : null, loc = typeof location !== "undefined" ? location : null) {
    const result = apply(doc, loc);
    if (doc && !doc.documentElement.getAttribute("data-aliaspaces-live-watch")) {
      doc.documentElement.setAttribute("data-aliaspaces-live-watch", "1");
      const observer = typeof MutationObserver === "function"
        ? new MutationObserver(() => apply(doc, loc))
        : null;
      if (observer && doc.body) observer.observe(doc.body, { childList: true, subtree: true });
      if (typeof window !== "undefined") {
        window.addEventListener("hashchange", () => apply(doc, loc));
      }
    }
    return result;
  }

  const api = {
    LIVE_ORIGIN,
    AUTOMATION_ROUTES,
    HIDE_SELECTORS,
    routeName,
    isAutomationRoute,
    isAutomationFile,
    socialLanding,
    apply,
    watch,
  };

  const root = typeof globalThis !== "undefined" ? globalThis : undefined;
  if (root) root.AliaSpacesLiveShell = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
