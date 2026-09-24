(() => {
  "use strict";

  const client = window.AliaSpacesLiveClient.createClient({ mode: "live" });
  const result = document.getElementById("result");
  const toast = document.getElementById("toast");

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function show(message) {
    toast.hidden = false;
    toast.textContent = message;
    window.clearTimeout(show.timer);
    show.timer = window.setTimeout(() => {
      toast.hidden = true;
    }, 3200);
  }

  document.getElementById("lookupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const handle = String(new FormData(event.target).get("handle") || "");
    const persona = await client.getPersonaByHandle(handle);
    if (!persona.ok || !persona.data) {
      result.innerHTML = `<div class="empty">No published persona matched that handle. That empty result is not treated as an online user.</div>`;
      show((persona.error && persona.error.message) || "No published persona matched.");
      return;
    }
    const row = persona.data;
    const posts = await client.listPublicPosts(row.id);
    const items = posts.ok && Array.isArray(posts.data) ? posts.data : [];
    result.innerHTML = `
      <article class="card">
        <h2>@${escapeHtml(row.handle)}</h2>
        <p>${escapeHtml(row.name || "")}</p>
        <p class="meta">${escapeHtml(row.publication_state || "unknown")} · ${escapeHtml(row.visibility || "unknown")}</p>
        <p>${escapeHtml(row.bio || row.tagline || "No public bio.")}</p>
      </article>
      <div class="list">${items.map((post) => `
        <article class="list-item">
          <p class="meta">${escapeHtml(post.kind || "update")}</p>
          ${post.title ? `<p><strong>${escapeHtml(post.title)}</strong></p>` : ""}
          <p>${escapeHtml(post.body || "")}</p>
        </article>
      `).join("") || `<div class="empty">No public posts returned.</div>`}</div>
    `;
  });
})();
