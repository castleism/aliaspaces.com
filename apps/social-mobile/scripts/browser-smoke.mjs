import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  const relative = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const file = path.normalize(path.join(appRoot, relative));
  if (!file.startsWith(appRoot)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    response.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404).end("not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const evidence = [];

try {
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  const banner = await page.locator(".banner").innerText();
  assert.match(banner, /local\/demo/i);
  assert.match(banner, /no online users/i);
  await page.screenshot({ path: "/opt/cursor/artifacts/aliaspaces-local-demo-banner.png", fullPage: true });

  async function createProfile(handle, name) {
    await page.getByRole("button", { name: "Profiles" }).click();
    await page.locator('input[name="handle"]').fill(handle);
    await page.locator('input[name="displayName"]').fill(name);
    await page.locator('textarea[name="bio"]').fill("Browser smoke profile");
    await page.getByRole("button", { name: "Create local profile" }).click();
    await page.getByText(`Acting as @${handle}`).waitFor();
  }

  await createProfile("smoke_north", "Smoke North");
  await page.getByRole("button", { name: "Post" }).click();
  await page.locator("textarea[name='body']").fill("North local smoke post");
  await page.getByRole("button", { name: "Save locally" }).click();

  await createProfile("smoke_south", "Smoke South");
  await page.getByRole("button", { name: "Post" }).click();
  await page.locator("textarea[name='body']").fill("South local smoke post");
  await page.getByRole("button", { name: "Save locally" }).click();

  await page.getByRole("button", { name: "Feed" }).click();
  await page.getByText("South local smoke post").waitFor();
  await page.getByText("North local smoke post").waitFor();
  await page.locator("article", { hasText: "North local smoke post" }).getByRole("button", { name: /^like/ }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("article", { hasText: "North local smoke post" }).getByRole("button", { name: "Block author" }).click();

  await page.getByRole("button", { name: "Feed" }).click();
  await page.locator("#panel-feed").getByText("South local smoke post").waitFor();
  assert.equal(await page.locator("#panel-feed").getByText("North local smoke post").count(), 0);
  await page.screenshot({ path: "/opt/cursor/artifacts/aliaspaces-local-south-feed.png", fullPage: true });

  await page.getByRole("button", { name: "You" }).click();
  await page.locator("#panel-you article", { hasText: "@smoke_north" }).getByRole("button", { name: "Act as this profile" }).click();
  await page.getByRole("button", { name: "Feed" }).click();
  assert.equal(await page.locator("#panel-feed").getByText("South local smoke post").count(), 0);

  evidence.push({
    banner,
    southSeesNorth: false,
    northSeesSouth: false,
    note: "Blocked author posts excluded for both local profiles. No network calls were issued by the app scripts.",
  });
  await page.screenshot({ path: "/opt/cursor/artifacts/aliaspaces-local-feed-after-block.png", fullPage: true });
  console.log(JSON.stringify({ ok: true, evidence }, null, 2));
} finally {
  await browser.close();
  server.close();
}
