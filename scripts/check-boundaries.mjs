import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const codeExtensions = new Set([".css", ".html", ".js", ".json", ".mjs", ".sql", ".ts"]);
const forbidden = [
  /agent[-_ ]board/i,
  /provider[-_ ]setup/i,
  /run[-_ ]tasks/i,
  /stripe[-_ ]webhook/i,
  /persona[-_ ]source[-_ ]library/i,
  /supabase_service_role_key/i,
  /service_role/i,
  /openai_api_key/i,
  /anthropic_api_key/i,
  /mistral_api_key/i,
  /together_api_key/i,
  /fireworks_api_key/i,
];

async function filesBelow(relative) {
  const start = path.join(root, relative);
  const output = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (codeExtensions.has(path.extname(entry.name))) output.push(target);
    }
  }
  await walk(start);
  return output;
}

const sourceFiles = [
  ...await filesBelow("apps/social-web"),
  ...await filesBelow("supabase/functions"),
  ...await filesBelow("supabase/migration-candidates"),
];

const violations = [];
for (const file of sourceFiles) {
  const text = await readFile(file, "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(text)) {
      violations.push(`${path.relative(root, file)} matches ${pattern}`);
    }
  }
}
assert.deepEqual(violations, [], `Automation/control-plane code crossed the AliaSpaces boundary:\n${violations.join("\n")}`);

const pages = await readFile(path.join(root, ".github/workflows/pages.yml"), "utf8");
assert.match(pages, /branches:\s*\[main\]/);
assert.match(pages, /github\.ref == 'refs\/heads\/main'/);
assert.doesNotMatch(pages, /workflow_dispatch/);
for (const directory of ["apps", "contracts", "docs", "scripts", "supabase"]) {
  assert.doesNotMatch(pages, new RegExp(`--include ['\"]\\/${directory}`));
}

for (const workflowName of ["ci.yml", "pages.yml"]) {
  const workflow = await readFile(path.join(root, ".github/workflows", workflowName), "utf8");
  const actionRefs = [...workflow.matchAll(/uses:\s*[^\s@]+@([^\s#]+)/g)].map((match) => match[1]);
  assert.ok(actionRefs.length > 0, `${workflowName} must declare at least one external action`);
  for (const actionRef of actionRefs) {
    assert.match(actionRef, /^[0-9a-f]{40}$/, `${workflowName} must pin external actions to full commit SHAs`);
  }
}

console.log(`Boundary check passed for ${sourceFiles.length} source files.`);
