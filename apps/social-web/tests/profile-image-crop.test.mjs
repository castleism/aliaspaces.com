import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (value) => readFile(path.join(appRoot, value), "utf8");

async function cropApi() {
  const source = await read("src/components/profile-image-crop.js");
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "profile-image-crop.js" });
  return sandbox.AliaSpacesProfileCrop;
}

test("crop geometry covers the target and clamps every edge", async () => {
  const crop = await cropApi();
  const centered = crop.cropGeometry({
    sourceWidth: 2000,
    sourceHeight: 1000,
    targetWidth: 1000,
    targetHeight: 1000,
  });
  assert.equal(centered.scale, 1);
  assert.equal(centered.drawWidth, 2000);
  assert.equal(centered.drawHeight, 1000);
  assert.equal(centered.maxOffsetX, 500);
  assert.equal(centered.maxOffsetY, 0);

  const edge = crop.cropGeometry({
    sourceWidth: 2000,
    sourceHeight: 1000,
    targetWidth: 1000,
    targetHeight: 1000,
    offsetX: 9999,
    offsetY: -9999,
  });
  assert.equal(edge.offsetX, edge.maxOffsetX);
  assert.equal(Math.abs(edge.offsetY), 0);
  assert.ok(edge.drawX <= 0);
  assert.ok(edge.drawX + edge.drawWidth >= 1000);
});

test("all social profile slots have bounded outputs and previews", async () => {
  const crop = await cropApi();
  assert.deepEqual(Object.keys(crop.specs), [
    "avatar_url",
    "banner_url",
    "bg_url",
    "feed_img_url",
  ]);
  for (const spec of Object.values(crop.specs)) {
    assert.ok(spec.width >= 768 && spec.width <= 1152);
    assert.ok(spec.height >= 512 && spec.height <= 768);
    assert.ok(spec.width * spec.height <= 2_000_000);
    assert.ok(spec.previews.length >= 2);
    assert.ok(spec.safe.width > 0 && spec.safe.width <= 1);
    assert.ok(spec.safe.height > 0 && spec.safe.height <= 1);
  }
});

test("workbench loads only local assets and exposes no upload path", async () => {
  const [html, app, crop] = await Promise.all([
    read("index.html"),
    read("src/app.js"),
    read("src/components/profile-image-crop.js"),
  ]);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /profile-image-crop\.js/);
  assert.match(html, /app\.js/);
  assert.match(app, /AliaSpacesProfileCrop\.open/);
  assert.match(app, /URL\.createObjectURL/);
  assert.doesNotMatch(app, /fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
  assert.match(crop, /global\.AliaSpacesProfileCrop/);
  assert.doesNotMatch(crop, /MyPersonasProfileCrop/);
});
