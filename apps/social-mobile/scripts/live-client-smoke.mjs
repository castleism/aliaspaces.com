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
  const relative = url.pathname === "/" ? "live.html" : url.pathname.slice(1);
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

try {
  await page.goto(`http://127.0.0.1:${port}/live.html?demo=1`, { waitUntil: "networkidle" });
  const banner = await page.locator("#banner").innerText();
  assert.match(banner, /fixture transport/i);
  assert.match(banner, /not written to the live database|not online users/i);
  assert.match(await page.locator("#actorLabel").innerText(), /not signed in/i);
  await page.screenshot({ path: "/opt/cursor/artifacts/aliaspaces-social-client-signed-out.png", fullPage: true });

  await page.getByRole("button", { name: "You" }).click();
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByText("Verified session").waitFor();
  assert.match(await page.locator("#actorLabel").innerText(), /signed in/i);
  await page.getByText("@fixture_north").waitFor();

  await page.getByRole("button", { name: "Discover" }).click();
  await page.locator("#panel-discover article", { hasText: "@fixture_south" }).getByRole("button", { name: "Open" }).click();
  await page.getByText("Fixture post from South").waitFor();
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("article", { hasText: "Fixture post from South" }).getByRole("button", { name: "Block author" }).click();
  await page.getByText("Block saved").waitFor();

  await page.locator('input[name="handle"]').fill("fixture_south");
  await page.getByRole("button", { name: "Look up" }).click();
  await page.waitForTimeout(200);
  assert.equal(await page.locator("#panel-discover").getByText("Fixture post from South").count(), 0);

  await page.getByRole("button", { name: "Post" }).click();
  await page.locator("textarea[name='body']").fill("Fixture review draft from smoke");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await page.getByText(/not auto-published/i).waitFor();

  await page.screenshot({ path: "/opt/cursor/artifacts/aliaspaces-social-client-after-block.png", fullPage: true });
  console.log(JSON.stringify({
    ok: true,
    signedIn: true,
    southHiddenAfterBlock: true,
    reviewGated: true,
  }, null, 2));
} finally {
  await browser.close();
  server.close();
}
