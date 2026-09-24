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
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  const relative = url.pathname === "/" ? "hub.html" : url.pathname.slice(1);
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
  await page.goto(`http://127.0.0.1:${port}/hub.html`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "On this phone after install" }).waitFor();
  await page.locator("#targets").getByText("AliaSpaces Web").waitFor();
  await page.locator("#targets").getByText("First-party Social").waitFor();
  await page.locator("#targets").getByText("Local demo").waitFor();
  const links = await page.locator("#targets a.btn").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
  assert.ok(links.includes("aliaspaces://website"));
  assert.ok(links.includes("aliaspaces://social"));
  assert.ok(links.includes("aliaspaces://local"));
  await page.screenshot({ path: "/opt/cursor/artifacts/aliaspaces-checker-hub.png", fullPage: true });
  console.log(JSON.stringify({ ok: true, links }, null, 2));
} finally {
  await browser.close();
  server.close();
}
