(() => {
  "use strict";

  const TARGETS = Object.freeze([
    {
      title: "AliaSpaces Web",
      href: "aliaspaces://website",
      meta: "Standalone browser app for https://mypersonas.online/. Same live accounts and database. No local JS bridge.",
    },
    {
      title: "Front door",
      href: "https://aliaspaces.com/",
      meta: "Public aliaspaces.com redirect. Opens the website browser app, then the live host.",
    },
    {
      title: "First-party Social",
      href: "aliaspaces://social",
      meta: "Developing social client. Email/password. Review-gated posts. Not a staff queue.",
    },
    {
      title: "Local demo",
      href: "aliaspaces://local",
      meta: "Offline device store. The Android bridge exists only here.",
    },
    {
      title: "Public persona lookup",
      href: "aliaspaces://persona",
      meta: "Read-only handle lookup. Empty results stay empty. Media IDs are still the live public URLs.",
    },
    {
      title: "Draft pull request",
      href: "https://github.com/castleism/aliaspaces.com/pull/1",
      meta: "Review surface for this branch. Opens in Chrome, not in the privileged WebView.",
    },
  ]);

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const root = document.getElementById("targets");
  if (root) {
    root.innerHTML = TARGETS.map((item) => `
      <article class="list-item">
        <p><strong>${escapeHtml(item.title)}</strong></p>
        <p class="meta">${escapeHtml(item.meta)}</p>
        <div class="actions">
          <a class="btn" href="${escapeHtml(item.href)}">Open</a>
        </div>
      </article>
    `).join("");
  }

  const api = { TARGETS };
  if (typeof globalThis !== "undefined") globalThis.AliaSpacesHub = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
