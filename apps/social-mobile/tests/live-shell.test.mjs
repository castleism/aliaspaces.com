import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function load(name) {
  const source = await readFile(path.join(appRoot, "src/live", name), "utf8");
  const sandbox = { module: { exports: {} }, URL };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: name });
  return sandbox;
}

test("live hosts allow the website and auth, not arbitrary origins", async () => {
  const { AliaSpacesLiveHosts: hosts } = await load("hosts.js");
  assert.equal(hosts.isLiveProductHost("https://mypersonas.online/#/owner"), true);
  assert.equal(hosts.isAllowedHost("https://nwsqyuucwzihruszocge.supabase.co/auth/v1/token"), true);
  assert.equal(hosts.isAllowedHost("https://accounts.google.com/o/oauth2/v2/auth"), true);
  assert.equal(hosts.isAllowedHost("https://evil.example/steal"), false);
  assert.equal(hosts.isAllowedHost("https://evil.supabase.co/auth/v1/token"), false);
  assert.equal(hosts.isAllowedHost("https://evil.com@mypersonas.online/"), false);
  assert.equal(hosts.isAllowedHost("http://mypersonas.online/"), false);
  assert.equal(hosts.hasUserInfo("https://evil.com@mypersonas.online/"), true);
});

test("automation routes are redirected and social landing stays the live site", async () => {
  const { AliaSpacesLiveShell: shell } = await load("social-shell.js");
  assert.equal(shell.isAutomationRoute("#/studio"), true);
  assert.equal(shell.isAutomationRoute("#/agent-board"), true);
  assert.equal(shell.isAutomationRoute("#/fan-inbox"), true);
  assert.equal(shell.isAutomationRoute("#/owner"), false);
  assert.equal(shell.isAutomationRoute("#/p/demo"), false);
  assert.equal(shell.isAutomationRoute("#/discovery"), false);
  assert.equal(shell.isAutomationFile("/provider-setup.html"), true);
  assert.equal(shell.socialLanding(), "https://mypersonas.online/");
});

test("live shell source hides automation controls without copying website HTML", async () => {
  const source = await readFile(path.join(appRoot, "src/live/social-shell.js"), "utf8");
  assert.match(source, /data-overview-nav/);
  assert.match(source, /go\('studio'\)/);
  assert.match(source, /agent-board/);
  assert.match(source, /mypersonas\.online/);
  assert.doesNotMatch(source, /service_role|SUPABASE_SERVICE_ROLE/);
  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest/);
});

test("live website still presents AliaSpaces sign-in and persona discovery", async () => {
  const html = await (await fetch("https://mypersonas.online/")).text();
  assert.match(html, /AliaSpaces/);
  assert.match(html, /go\('signin'\)|authAction\(\)/);
  assert.match(html, /go\(''\)|Entangle/);
  assert.match(html, /nwsqyuucwzihruszocge\.supabase\.co/);
  assert.match(html, /sb_publishable_/);
});
