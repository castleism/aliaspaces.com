import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("packaged surfaces are installable PWAs with PNG icons", async () => {
  for (const [page, manifestName] of [
    ["hub.html", "hub.webmanifest"],
    ["live.html", "social.webmanifest"],
    ["persona.html", "persona.webmanifest"],
    ["index.html", "local.webmanifest"],
  ]) {
    const html = await readFile(path.join(appRoot, page), "utf8");
    assert.match(html, new RegExp(`rel="manifest" href="./${manifestName}"`));
    assert.match(html, /register-pwa\.js/);
    assert.match(html, /worker-src 'self'/);
    const manifest = JSON.parse(await readFile(path.join(appRoot, manifestName), "utf8"));
    assert.equal(manifest.display, "standalone");
    assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
    assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
    assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
  }
  const worker = await readFile(path.join(appRoot, "sw.js"), "utf8");
  assert.match(worker, /caches\.open/);
  assert.match(worker, /register-pwa\.js/);
  assert.match(worker, /hub\.js/);
  assert.doesNotMatch(worker, /service_role/);
  const png = await readFile(path.join(appRoot, "icons/icon-192.png"));
  assert.equal(png[0], 0x89);
  assert.equal(png[1], 0x50);
});
