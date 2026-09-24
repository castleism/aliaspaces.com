import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Android splits the website browser app from the local bridge", async () => {
  const activity = await readFile(path.join(appRoot, "android/app/src/main/java/com/aliaspaces/social/local/MainActivity.kt"), "utf8");
  const website = await readFile(path.join(appRoot, "android/app/src/main/java/com/aliaspaces/social/local/WebsiteActivity.kt"), "utf8");
  const policy = await readFile(path.join(appRoot, "android/app/src/main/java/com/aliaspaces/social/local/NavigationPolicy.kt"), "utf8");
  const manifest = await readFile(path.join(appRoot, "android/app/src/main/AndroidManifest.xml"), "utf8");
  const gradle = await readFile(path.join(appRoot, "android/app/build.gradle"), "utf8");

  assert.match(manifest, /android.permission.INTERNET/);
  assert.match(manifest, /WebsiteActivity/);
  assert.match(manifest, /android.intent.category.LAUNCHER/);
  assert.equal([...manifest.matchAll(/android.intent.category.LAUNCHER/g)].length, 2);
  assert.match(gradle, /0\.4\.0-check/);
  assert.match(gradle, /hub\.html/);
  assert.match(gradle, /persona\.html/);

  assert.match(activity, /MODE_CHECK/);
  assert.match(activity, /addJavascriptInterface/);
  assert.match(activity, /removeJavascriptInterface/);
  assert.match(activity, /appMode == MODE_LOCAL/);
  assert.match(activity, /WebsiteActivity\.intent/);
  assert.doesNotMatch(activity, /addJavascriptInterface\(Bridge\(\), BRIDGE_NAME\)[\s\S]*webView\.webViewClient/);
  assert.doesNotMatch(activity, /endsWith\("\.supabase\.co"\)/);
  assert.doesNotMatch(activity, /type = "\*\/\*"/);

  assert.doesNotMatch(website, /JavascriptInterface|AliaSpacesAndroid/);
  assert.match(website, /NavigationPolicy\.isAllowed/);
  assert.match(website, /type = "image\/\*"/);

  assert.match(policy, /userInfo/);
  assert.match(policy, /nwsqyuucwzihruszocge\.supabase\.co/);
  assert.doesNotMatch(policy, /endsWith/);
  assert.doesNotMatch(activity, /service_role|SUPABASE_SERVICE_ROLE/);
});
