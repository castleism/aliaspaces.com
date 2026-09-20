import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Android shell defaults to the live website and keeps local demo", async () => {
  const activity = await readFile(path.join(appRoot, "android/app/src/main/java/com/aliaspaces/social/local/MainActivity.kt"), "utf8");
  const manifest = await readFile(path.join(appRoot, "android/app/src/main/AndroidManifest.xml"), "utf8");
  assert.match(manifest, /android.permission.INTERNET/);
  assert.match(activity, /https:\/\/mypersonas\.online\//);
  assert.match(activity, /appassets\.androidplatform\.net\/assets\/www\/index.html/);
  assert.match(activity, /AliaSpacesLiveShell\.watch/);
  assert.match(activity, /CustomTabsIntent/);
  assert.doesNotMatch(activity, /service_role|SUPABASE_SERVICE_ROLE/);
});
