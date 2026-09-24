import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("checker lists the website browser app and in-progress clients", async () => {
  const source = await readFile(path.join(appRoot, "src/live/hub.js"), "utf8");
  const sandbox = { module: { exports: {} }, document: { getElementById() { return null; } } };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "hub.js" });
  const titles = sandbox.AliaSpacesHub.TARGETS.map((item) => item.title);
  assert.deepEqual(titles.includes("AliaSpaces Web"), true);
  assert.deepEqual(titles.includes("First-party Social"), true);
  assert.deepEqual(titles.includes("Local demo"), true);
  assert.deepEqual(titles.includes("Public persona lookup"), true);
  const html = await readFile(path.join(appRoot, "hub.html"), "utf8");
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /Sites and apps to check/);
});
