import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const domainPath = path.join(appRoot, "src/domain/local-social.js");

async function loadDomain() {
  const source = await readFile(domainPath, "utf8");
  const sandbox = { module: { exports: {} }, globalThis: {} };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "local-social.js" });
  return sandbox.AliaSpacesLocal;
}

function asList(values) {
  return [...values].map((value) => String(value));
}

function seedTwoProfiles(api) {
  let state = api.emptyState();
  const north = api.createProfile(state, {
    handle: "north",
    displayName: "North",
    bio: "Local test profile",
  }, { id: "prf_north" });
  state = north.state;
  const south = api.createProfile(state, {
    handle: "south",
    displayName: "South",
    bio: "Second local test profile",
  }, { id: "prf_south" });
  state = south.state;
  assert.equal(state.activeProfileId, "prf_south");
  const west = api.createProfile(state, {
    handle: "west",
    displayName: "West",
    bio: "Unaffected local test profile",
  }, { id: "prf_west" });
  state = west.state;
  state = api.createPost(state, {
    authorProfileId: "prf_north",
    body: "North post visible until blocked",
  }, { id: "pst_north" }).state;
  state = api.createPost(state, {
    authorProfileId: "prf_south",
    body: "South post visible until blocked",
  }, { id: "pst_south" }).state;
  state = api.createPost(state, {
    authorProfileId: "prf_west",
    body: "West post stays visible",
  }, { id: "pst_west" }).state;
  return state;
}

test("handles, posts, reactions, reports, and blocks persist in one local store", async () => {
  const api = await loadDomain();
  let state = seedTwoProfiles(api);
  state = api.react(state, { actorProfileId: "prf_south", postId: "pst_north", kind: "like" }).state;
  state = api.report(state, {
    reporterProfileId: "prf_west",
    targetType: "post",
    targetId: "pst_south",
    reason: "spam",
    notes: "Local fixture report",
  }).state;
  state = api.block(state, { blockerProfileId: "prf_north", blockedProfileId: "prf_south" }).state;

  const restored = api.parse(api.serialize(state));
  assert.equal(restored.mode, "local-demo");
  assert.equal(restored.network, "offline-local");
  assert.equal(restored.profiles.length, 3);
  assert.equal(restored.posts.length, 3);
  assert.equal(restored.reactions.length, 1);
  assert.equal(restored.reports.length, 1);
  assert.equal(restored.blocks.length, 1);
});

test("symmetric blocks hide profiles, posts, reactions, and reports in every viewer path", async () => {
  const api = await loadDomain();
  let state = seedTwoProfiles(api);
  state = api.react(state, { actorProfileId: "prf_south", postId: "pst_west", kind: "support" }).state;
  state = api.react(state, { actorProfileId: "prf_north", postId: "pst_west", kind: "like" }).state;
  state = api.report(state, {
    reporterProfileId: "prf_south",
    targetType: "profile",
    targetId: "prf_west",
    reason: "other",
  }).state;
  state = api.block(state, { blockerProfileId: "prf_north", blockedProfileId: "prf_south" }).state;

  const northFeed = asList(api.visibleFeed(state, "prf_north").map((post) => post.id));
  const southFeed = asList(api.visibleFeed(state, "prf_south").map((post) => post.id));
  const westFeed = asList(api.visibleFeed(state, "prf_west").map((post) => post.id));

  assert.equal(northFeed.includes("pst_south"), false);
  assert.equal(southFeed.includes("pst_north"), false);
  assert.equal(northFeed.includes("pst_west") && northFeed.includes("pst_north"), true);
  assert.equal(southFeed.includes("pst_west") && southFeed.includes("pst_south"), true);
  assert.equal(westFeed.includes("pst_west") && westFeed.includes("pst_south") && westFeed.includes("pst_north"), true);

  assert.equal(api.canSeeProfile(state, "prf_north", "prf_south"), false);
  assert.equal(api.canSeeProfile(state, "prf_south", "prf_north"), false);
  assert.equal(api.canSeeProfile(state, "prf_west", "prf_south"), true);

  const westReactionsForNorth = asList(api.visibleReactions(state, "prf_north", "pst_west").map((item) => item.actorProfileId));
  const westReactionsForSouth = asList(api.visibleReactions(state, "prf_south", "pst_west").map((item) => item.actorProfileId));
  const westReactionsForWest = asList(api.visibleReactions(state, "prf_west", "pst_west").map((item) => item.actorProfileId)).sort();
  assert.equal(westReactionsForNorth.join(","), "prf_north");
  assert.equal(westReactionsForSouth.join(","), "prf_south");
  assert.equal(westReactionsForWest.join(","), "prf_north,prf_south");

  const northReports = asList(api.visibleReports(state, "prf_north").map((item) => item.reporterProfileId));
  const southReports = asList(api.visibleReports(state, "prf_south").map((item) => item.reporterProfileId));
  assert.equal(northReports.join(","), "");
  assert.equal(southReports.join(","), "prf_south");

  const northSnapshot = api.viewerSnapshot(state, "prf_north");
  assert.equal(asList(northSnapshot.hiddenProfileIds).join(","), "prf_south");
  assert.equal(northSnapshot.posts.some((post) => post.authorProfileId === "prf_south"), false);
});

test("blocked content cannot be reacted to or reported, and reverse blocks stay hidden", async () => {
  const api = await loadDomain();
  let state = seedTwoProfiles(api);
  state = api.block(state, { blockerProfileId: "prf_south", blockedProfileId: "prf_north" }).state;

  assert.throws(
    () => api.react(state, { actorProfileId: "prf_north", postId: "pst_south", kind: "like" }),
    (error) => error.code === "blocked",
  );
  assert.throws(
    () => api.report(state, {
      reporterProfileId: "prf_north",
      targetType: "post",
      targetId: "pst_south",
      reason: "spam",
    }),
    (error) => error.code === "blocked",
  );
  assert.throws(
    () => api.block(state, { blockerProfileId: "prf_north", blockedProfileId: "prf_north" }),
    (error) => error.code === "self-block",
  );
  assert.throws(
    () => api.report(state, {
      reporterProfileId: "prf_north",
      targetType: "post",
      targetId: "pst_north",
      reason: "spam",
    }),
    (error) => error.code === "self-report",
  );

  state = api.unblock(state, { blockerProfileId: "prf_south", blockedProfileId: "prf_north" }).state;
  const restoredFeed = api.visibleFeed(state, "prf_north").map((post) => post.id);
  assert.ok(restoredFeed.includes("pst_south"));
});

test("import rejects network claims and fixtures stay labeled separately from user records", async () => {
  const api = await loadDomain();
  let state = api.emptyState();
  state = api.createProfile(state, { handle: "owner", displayName: "Owner" }).state;
  state = api.loadFixtures(state).state;

  const owner = state.profiles.find((profile) => profile.handle === "owner");
  const fixtures = state.profiles.filter((profile) => profile.source === "fixture");
  assert.equal(owner.source, "user");
  assert.equal(fixtures.length, 2);
  assert.ok(state.posts.every((post) => post.source === "fixture"));

  const honest = api.exportBundle(state);
  assert.equal(honest.mode, "local-demo");
  assert.match(honest.warning, /not a server backup/i);

  assert.throws(
    () => api.importBundle(state, { ...honest, network: "online", state: { ...honest.state, network: "online" } }),
    (error) => error.code === "invalid-import" || error.code === "invalid-network",
  );
});
