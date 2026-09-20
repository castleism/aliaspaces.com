import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shell = await readFile(path.join(appRoot, "src/live/social-shell.js"), "utf8");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  const response = await page.goto("https://mypersonas.online/", { waitUntil: "domcontentloaded", timeout: 45000 });
  assert.ok(response && response.ok(), "Live website did not return HTTP success");
  await page.waitForSelector("header h1, #authBtn, nav", { timeout: 20000 });
  const title = await page.title();
  assert.match(title, /AliaSpaces/i);
  await page.screenshot({ path: "/opt/cursor/artifacts/aliaspaces-live-website-before-shell.png", fullPage: false });

  await page.addScriptTag({ content: `${shell}\nwindow.AliaSpacesLiveShell.watch();` });
  await page.evaluate(() => { location.hash = "#/studio"; });
  await page.waitForTimeout(250);
  const after = await page.evaluate(() => ({
    hash: location.hash,
    studioVisible: [...document.querySelectorAll("button")].some((button) => (
      !button.hidden && /Matrix|Your studio/i.test(button.textContent || "") && button.style.display !== "none"
    )),
    signInPresent: !!document.getElementById("authBtn") || /sign in/i.test(document.body.innerText),
    banner: document.getElementById("aliaspacesLiveBanner")?.textContent || "",
  }));
  assert.match(after.banner, /Live AliaSpaces website/i);
  assert.equal(after.studioVisible, false);
  assert.equal(after.signInPresent, true);
  assert.equal(after.hash === "#/studio", false);
  await page.screenshot({ path: "/opt/cursor/artifacts/aliaspaces-live-website-social-shell.png", fullPage: false });
  console.log(JSON.stringify({ ok: true, title, after }, null, 2));
} finally {
  await browser.close();
}
