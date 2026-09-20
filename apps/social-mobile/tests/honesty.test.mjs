import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function filesBelow(relative, extensions) {
  const start = path.join(appRoot, relative);
  const output = [];
  async function walk(current) {
    let entries = [];
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch (error) {
      if (error && error.code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries) {
      if (entry.name === "live") continue;
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (extensions.has(path.extname(entry.name))) output.push(target);
    }
  }
  await walk(start);
  return output;
}

test("mobile surface labels itself local/demo and does not claim network success", async () => {
  const html = await readFile(path.join(appRoot, "index.html"), "utf8");
  const app = await readFile(path.join(appRoot, "src/ui/app.js"), "utf8");
  const css = await readFile(path.join(appRoot, "src/ui/app.css"), "utf8");
  const readme = await readFile(path.join(appRoot, "README.md"), "utf8");

  for (const text of [html, app, readme]) {
    assert.match(text, /local demo|local\/demo|offline-local/i);
    assert.doesNotMatch(text, /users online|online friends|synced to the cloud|posted publicly/i);
  }
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /Local demo/);
  assert.match(app, /AliaSpacesLocal/);
  assert.match(app, /Device identity switcher/);
  assert.doesNotMatch(app, /fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
  const liveHtml = await readFile(path.join(appRoot, "live.html"), "utf8");
  assert.match(liveHtml, /First-party social client/);
  assert.match(liveHtml, /connect-src https:\/\/nwsqyuucwzihruszocge\.supabase\.co/);
  assert.doesNotMatch(liveHtml, /connect-src 'none'/);
  assert.match(css, /safe-area/);
});

test("app source stays offline and does not include automation secrets", async () => {
  const files = [
    ...await filesBelow("src", new Set([".js", ".css", ".html"])),
    ...await filesBelow(".", new Set([".html"])),
  ];
  const forbidden = [
    /supabase_service_role_key/i,
    /service_role/i,
    /openai_api_key/i,
    /agent[-_ ]board/i,
    /stripe[-_ ]webhook/i,
  ];
  const network = /fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/;
  const violations = [];
  for (const file of files) {
    const text = await readFile(file, "utf8");
    if (network.test(text)) violations.push(`${path.relative(appRoot, file)} makes a network call`);
    for (const pattern of forbidden) {
      if (pattern.test(text)) violations.push(`${path.relative(appRoot, file)} matches ${pattern}`);
    }
  }
  assert.deepEqual(violations, []);
});
