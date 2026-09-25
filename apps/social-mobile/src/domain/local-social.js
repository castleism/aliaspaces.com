(() => {
  "use strict";

  const STORE_VERSION = 1;
  const MODE = "local-demo";
  const STORAGE_KEY = "aliaspaces.social.local.v1";
  const HANDLE_RE = /^[a-z][a-z0-9_]{1,23}$/;
  const REACTION_KINDS = Object.freeze(["like", "celebrate", "support", "insight"]);
  const REPORT_REASONS = Object.freeze([
    "spam",
    "harassment",
    "impersonation",
    "illegal",
    "other",
  ]);
  const TARGET_TYPES = Object.freeze(["post", "profile"]);
  const PROFILE_SOURCES = Object.freeze(["user", "fixture"]);
  const LIMITS = Object.freeze({
    displayName: 48,
    bio: 280,
    postBody: 500,
    reportNotes: 400,
    handleMin: 2,
    handleMax: 24,
  });

  class DomainError extends Error {
    constructor(code, message) {
      super(message);
      this.name = "AliaSpacesDomainError";
      this.code = code;
    }
  }

  function nowIso(clock) {
    return new Date(clock ? clock() : Date.now()).toISOString();
  }

  function createId(prefix, random = Math.random) {
    const rand = random().toString(36).slice(2, 10);
    const time = Date.now().toString(36);
    return `${prefix}_${time}${rand}`;
  }

  function assert(condition, code, message) {
    if (!condition) throw new DomainError(code, message);
  }

  function normalizeHandle(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function emptyState() {
    return {
      version: STORE_VERSION,
      mode: MODE,
      network: "offline-local",
      activeProfileId: null,
      profiles: [],
      posts: [],
      reactions: [],
      reports: [],
      blocks: [],
    };
  }

  function createState(seed = {}, options = {}) {
    const state = emptyState();
    if (seed && typeof seed === "object") Object.assign(state, clone(seed));
    state.version = STORE_VERSION;
    state.mode = MODE;
    state.network = "offline-local";
    state.profiles = Array.isArray(state.profiles) ? state.profiles : [];
    state.posts = Array.isArray(state.posts) ? state.posts : [];
    state.reactions = Array.isArray(state.reactions) ? state.reactions : [];
    state.reports = Array.isArray(state.reports) ? state.reports : [];
    state.blocks = Array.isArray(state.blocks) ? state.blocks : [];
    if (options.validate !== false) validateState(state);
    return state;
  }

  function profileById(state, id) {
    return state.profiles.find((profile) => profile.id === id) || null;
  }

  function postById(state, id) {
    return state.posts.find((post) => post.id === id) || null;
  }

  function pairBlocked(state, leftId, rightId) {
    if (!leftId || !rightId || leftId === rightId) return false;
    return state.blocks.some((block) => (
      (block.blockerProfileId === leftId && block.blockedProfileId === rightId) ||
      (block.blockerProfileId === rightId && block.blockedProfileId === leftId)
    ));
  }

  function hiddenProfileIds(state, viewerId) {
    const hidden = new Set();
    for (const block of state.blocks) {
      if (block.blockerProfileId === viewerId) hidden.add(block.blockedProfileId);
      if (block.blockedProfileId === viewerId) hidden.add(block.blockerProfileId);
    }
    return hidden;
  }

  function canSeeProfile(state, viewerId, profileId) {
    if (!viewerId || !profileId) return false;
    if (!profileById(state, viewerId) || !profileById(state, profileId)) return false;
    return !pairBlocked(state, viewerId, profileId);
  }

  function canSeePost(state, viewerId, post) {
    if (!post) return false;
    return canSeeProfile(state, viewerId, post.authorProfileId);
  }

  function canSeeReaction(state, viewerId, reaction) {
    if (!reaction) return false;
    const post = postById(state, reaction.postId);
    if (!canSeePost(state, viewerId, post)) return false;
    return canSeeProfile(state, viewerId, reaction.actorProfileId);
  }

  function visibleProfiles(state, viewerId) {
    return state.profiles.filter((profile) => canSeeProfile(state, viewerId, profile.id));
  }

  function visibleFeed(state, viewerId) {
    return state.posts
      .filter((post) => canSeePost(state, viewerId, post))
      .sort((a, b) => {
        const byTime = String(b.createdAt).localeCompare(String(a.createdAt));
        return byTime !== 0 ? byTime : String(b.id).localeCompare(String(a.id));
      });
  }

  function visibleReactions(state, viewerId, postId) {
    const post = postById(state, postId);
    if (!canSeePost(state, viewerId, post)) return [];
    return state.reactions.filter((reaction) => (
      reaction.postId === postId && canSeeReaction(state, viewerId, reaction)
    ));
  }

  function visibleReports(state, viewerId) {
    if (!profileById(state, viewerId)) return [];
    return state.reports.filter((report) => {
      if (report.reporterProfileId === viewerId) return true;
      if (report.targetType === "profile") return canSeeProfile(state, viewerId, report.targetId);
      if (report.targetType === "post") {
        const post = postById(state, report.targetId);
        return canSeePost(state, viewerId, post);
      }
      return false;
    }).filter((report) => canSeeProfile(state, viewerId, report.reporterProfileId));
  }

  function viewerSnapshot(state, viewerId) {
    const viewer = profileById(state, viewerId);
    assert(viewer, "unknown-profile", "The acting profile does not exist on this device.");
    const hidden = [...hiddenProfileIds(state, viewerId)];
    const posts = visibleFeed(state, viewerId);
    return {
      mode: MODE,
      network: "offline-local",
      viewer,
      hiddenProfileIds: hidden,
      profiles: visibleProfiles(state, viewerId),
      posts,
      reactions: posts.flatMap((post) => visibleReactions(state, viewerId, post.id)),
      reports: visibleReports(state, viewerId),
      blocks: state.blocks.filter((block) => (
        block.blockerProfileId === viewerId || block.blockedProfileId === viewerId
      )),
    };
  }

  function validateProfile(profile, usedHandles) {
    assert(profile && typeof profile === "object", "invalid-profile", "Profile is required.");
    assert(typeof profile.id === "string" && profile.id, "invalid-profile", "Profile id is required.");
    const handle = normalizeHandle(profile.handle);
    assert(HANDLE_RE.test(handle), "invalid-handle", "Handles use 2–24 lowercase letters, numbers, or underscores.");
    assert(!usedHandles.has(handle), "duplicate-handle", "That handle is already used by a local profile.");
    usedHandles.add(handle);
    const displayName = normalizeText(profile.displayName);
    assert(displayName.length >= 1 && displayName.length <= LIMITS.displayName, "invalid-display-name", "Display names must be 1–48 characters.");
    const bio = normalizeText(profile.bio || "");
    assert(bio.length <= LIMITS.bio, "invalid-bio", "Bios must be 280 characters or fewer.");
    assert(PROFILE_SOURCES.includes(profile.source || "user"), "invalid-source", "Profile source must be user or fixture.");
  }

  function validateState(state) {
    assert(state && typeof state === "object", "invalid-state", "State is required.");
    assert(state.mode === MODE, "invalid-mode", "This store only accepts local-demo state.");
    assert(state.network === "offline-local", "invalid-network", "This prototype cannot claim a network.");
    const handles = new Set();
    const profileIds = new Set();
    for (const profile of state.profiles) {
      validateProfile(profile, handles);
      assert(!profileIds.has(profile.id), "duplicate-profile", "Duplicate profile id.");
      profileIds.add(profile.id);
    }
    if (state.activeProfileId) {
      assert(profileIds.has(state.activeProfileId), "unknown-profile", "Active profile is missing.");
    }
    const postIds = new Set();
    for (const post of state.posts) {
      assert(profileIds.has(post.authorProfileId), "unknown-author", "Post author is missing.");
      const body = normalizeText(post.body);
      assert(body.length >= 1 && body.length <= LIMITS.postBody, "invalid-post", "Posts must be 1–500 characters.");
      assert(!postIds.has(post.id), "duplicate-post", "Duplicate post id.");
      postIds.add(post.id);
    }
    const reactionKeys = new Set();
    for (const reaction of state.reactions) {
      assert(postIds.has(reaction.postId), "unknown-post", "Reaction target is missing.");
      assert(profileIds.has(reaction.actorProfileId), "unknown-actor", "Reaction actor is missing.");
      assert(REACTION_KINDS.includes(reaction.kind), "invalid-reaction", "Unknown reaction.");
      const key = `${reaction.actorProfileId}:${reaction.postId}`;
      assert(!reactionKeys.has(key), "duplicate-reaction", "Only one reaction per actor and post.");
      reactionKeys.add(key);
    }
    for (const report of state.reports) {
      assert(profileIds.has(report.reporterProfileId), "unknown-reporter", "Reporter is missing.");
      assert(TARGET_TYPES.includes(report.targetType), "invalid-target", "Reports target a post or profile.");
      assert(REPORT_REASONS.includes(report.reason), "invalid-reason", "Unknown report reason.");
      if (report.targetType === "profile") assert(profileIds.has(report.targetId), "unknown-target", "Reported profile is missing.");
      if (report.targetType === "post") assert(postIds.has(report.targetId), "unknown-target", "Reported post is missing.");
    }
    const blockKeys = new Set();
    for (const block of state.blocks) {
      assert(profileIds.has(block.blockerProfileId), "unknown-blocker", "Blocker is missing.");
      assert(profileIds.has(block.blockedProfileId), "unknown-blocked", "Blocked profile is missing.");
      assert(block.blockerProfileId !== block.blockedProfileId, "self-block", "A profile cannot block itself.");
      const key = `${block.blockerProfileId}:${block.blockedProfileId}`;
      assert(!blockKeys.has(key), "duplicate-block", "That block already exists.");
      blockKeys.add(key);
    }
  }

  function requireProfile(state, id, code = "unknown-profile") {
    const profile = profileById(state, id);
    assert(profile, code, "That local profile was not found.");
    return profile;
  }

  function createProfile(state, input, options = {}) {
    const next = clone(state);
    const profile = {
      id: options.id || createId("prf", options.random),
      handle: normalizeHandle(input.handle),
      displayName: normalizeText(input.displayName),
      bio: normalizeText(input.bio || ""),
      source: PROFILE_SOURCES.includes(input.source) ? input.source : "user",
      createdAt: input.createdAt || nowIso(options.clock),
      updatedAt: input.updatedAt || nowIso(options.clock),
    };
    next.profiles.push(profile);
    next.activeProfileId = profile.id;
    validateState(next);
    return { state: next, profile };
  }

  function updateProfile(state, profileId, input, options = {}) {
    const next = clone(state);
    const profile = requireProfile(next, profileId);
    if (input.handle !== undefined) profile.handle = normalizeHandle(input.handle);
    if (input.displayName !== undefined) profile.displayName = normalizeText(input.displayName);
    if (input.bio !== undefined) profile.bio = normalizeText(input.bio);
    profile.updatedAt = nowIso(options.clock);
    validateState(next);
    return { state: next, profile };
  }

  function setActiveProfile(state, profileId) {
    const next = clone(state);
    requireProfile(next, profileId);
    next.activeProfileId = profileId;
    return { state: next, profile: profileById(next, profileId) };
  }

  function createPost(state, input, options = {}) {
    const next = clone(state);
    const author = requireProfile(next, input.authorProfileId, "unknown-author");
    const post = {
      id: options.id || createId("pst", options.random),
      authorProfileId: author.id,
      body: normalizeText(input.body),
      source: input.source === "fixture" ? "fixture" : "user",
      createdAt: input.createdAt || nowIso(options.clock),
      updatedAt: input.updatedAt || nowIso(options.clock),
    };
    next.posts.unshift(post);
    validateState(next);
    return { state: next, post };
  }

  function deletePost(state, input) {
    const next = clone(state);
    const actor = requireProfile(next, input.actorProfileId);
    const post = postById(next, input.postId);
    assert(post, "unknown-post", "That post was not found.");
    assert(post.authorProfileId === actor.id, "not-author", "Only the author can delete a local post.");
    next.posts = next.posts.filter((item) => item.id !== post.id);
    next.reactions = next.reactions.filter((item) => item.postId !== post.id);
    next.reports = next.reports.filter((item) => !(item.targetType === "post" && item.targetId === post.id));
    return { state: next };
  }

  function react(state, input, options = {}) {
    const next = clone(state);
    const actor = requireProfile(next, input.actorProfileId, "unknown-actor");
    const post = postById(next, input.postId);
    assert(post, "unknown-post", "That post was not found.");
    assert(canSeePost(next, actor.id, post), "blocked", "Blocked content cannot be reacted to.");
    assert(REACTION_KINDS.includes(input.kind), "invalid-reaction", "Unknown reaction.");
    const existing = next.reactions.find((item) => (
      item.actorProfileId === actor.id && item.postId === post.id
    ));
    if (existing && existing.kind === input.kind) {
      next.reactions = next.reactions.filter((item) => item !== existing);
      return { state: next, reaction: null };
    }
    const reaction = existing || {
      id: options.id || createId("rct", options.random),
      postId: post.id,
      actorProfileId: actor.id,
      kind: input.kind,
      createdAt: nowIso(options.clock),
    };
    reaction.kind = input.kind;
    reaction.updatedAt = nowIso(options.clock);
    if (!existing) next.reactions.push(reaction);
    validateState(next);
    return { state: next, reaction };
  }

  function report(state, input, options = {}) {
    const next = clone(state);
    const reporter = requireProfile(next, input.reporterProfileId, "unknown-reporter");
    assert(TARGET_TYPES.includes(input.targetType), "invalid-target", "Reports target a post or profile.");
    assert(REPORT_REASONS.includes(input.reason), "invalid-reason", "Choose a report reason.");
    const notes = normalizeText(input.notes || "");
    assert(notes.length <= LIMITS.reportNotes, "invalid-notes", "Report notes must be 400 characters or fewer.");

    if (input.targetType === "profile") {
      const target = requireProfile(next, input.targetId, "unknown-target");
      assert(target.id !== reporter.id, "self-report", "A profile cannot report itself.");
      assert(canSeeProfile(next, reporter.id, target.id), "blocked", "Blocked profiles cannot be reported.");
    } else {
      const post = postById(next, input.targetId);
      assert(post, "unknown-target", "Reported post is missing.");
      assert(post.authorProfileId !== reporter.id, "self-report", "Authors cannot report their own posts.");
      assert(canSeePost(next, reporter.id, post), "blocked", "Blocked posts cannot be reported.");
    }

    const duplicate = next.reports.find((item) => (
      item.reporterProfileId === reporter.id &&
      item.targetType === input.targetType &&
      item.targetId === input.targetId &&
      item.status === "open"
    ));
    assert(!duplicate, "duplicate-report", "An open report for that target already exists on this device.");

    const record = {
      id: options.id || createId("rpt", options.random),
      reporterProfileId: reporter.id,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      notes,
      status: "open",
      createdAt: nowIso(options.clock),
    };
    next.reports.push(record);
    validateState(next);
    return { state: next, report: record };
  }

  function block(state, input, options = {}) {
    const next = clone(state);
    const blocker = requireProfile(next, input.blockerProfileId, "unknown-blocker");
    const blocked = requireProfile(next, input.blockedProfileId, "unknown-blocked");
    assert(blocker.id !== blocked.id, "self-block", "A profile cannot block itself.");
    const exists = next.blocks.some((item) => (
      item.blockerProfileId === blocker.id && item.blockedProfileId === blocked.id
    ));
    assert(!exists, "duplicate-block", "That local block already exists.");
    next.blocks.push({
      id: options.id || createId("blk", options.random),
      blockerProfileId: blocker.id,
      blockedProfileId: blocked.id,
      createdAt: nowIso(options.clock),
    });
    next.reactions = next.reactions.filter((item) => {
      if (item.actorProfileId === blocker.id && !canSeePost(next, blocker.id, postById(next, item.postId))) return false;
      return true;
    });
    validateState(next);
    return { state: next };
  }

  function unblock(state, input) {
    const next = clone(state);
    requireProfile(next, input.blockerProfileId, "unknown-blocker");
    next.blocks = next.blocks.filter((item) => !(
      item.blockerProfileId === input.blockerProfileId &&
      item.blockedProfileId === input.blockedProfileId
    ));
    return { state: next };
  }

  function fixtureCatalog() {
    return {
      label: "Local demo fixtures",
      note: "These records are generated on this device. They are not online users and never leave the device unless exported.",
      profiles: [
        { handle: "demo_north", displayName: "Demo North", bio: "Local fixture profile for feed and block tests.", source: "fixture" },
        { handle: "demo_south", displayName: "Demo South", bio: "Second local fixture. Not an online account.", source: "fixture" },
      ],
      posts: [
        { authorHandle: "demo_north", body: "Fixture post from Demo North. Stored only on this device." },
        { authorHandle: "demo_south", body: "Fixture post from Demo South. Use this to test blocks and reports locally." },
      ],
    };
  }

  function loadFixtures(state, options = {}) {
    let next = clone(state);
    const catalog = fixtureCatalog();
    const created = [];
    for (const profile of catalog.profiles) {
      if (next.profiles.some((item) => item.handle === profile.handle)) continue;
      const result = createProfile(next, profile, options);
      next = result.state;
      created.push(result.profile);
    }
    for (const post of catalog.posts) {
      const author = next.profiles.find((item) => item.handle === post.authorHandle);
      const exists = next.posts.some((item) => item.source === "fixture" && item.body === post.body);
      if (!author || exists) continue;
      next = createPost(next, {
        authorProfileId: author.id,
        body: post.body,
        source: "fixture",
      }, options).state;
    }
    return { state: next, created };
  }

  function exportBundle(state) {
    validateState(state);
    return {
      format: "aliaspaces.social.local",
      formatVersion: STORE_VERSION,
      mode: MODE,
      network: "offline-local",
      exportedAt: new Date().toISOString(),
      warning: "Local demo export. This file is not a server backup and does not prove online accounts.",
      state: clone(state),
    };
  }

  function importBundle(current, bundle, options = {}) {
    assert(bundle && typeof bundle === "object", "invalid-import", "Choose an AliaSpaces local export.");
    assert(bundle.format === "aliaspaces.social.local", "invalid-import", "That file is not an AliaSpaces local export.");
    assert(bundle.mode === MODE && bundle.network === "offline-local", "invalid-import", "Import rejected a bundle that claimed a network.");
    const incoming = createState(bundle.state);
    if (options.mode === "merge") {
      const merged = clone(current);
      const seenProfiles = new Set(merged.profiles.map((item) => item.id));
      const seenHandles = new Set(merged.profiles.map((item) => item.handle));
      for (const profile of incoming.profiles) {
        if (seenProfiles.has(profile.id) || seenHandles.has(profile.handle)) continue;
        merged.profiles.push(profile);
        seenProfiles.add(profile.id);
        seenHandles.add(profile.handle);
      }
      const seenPosts = new Set(merged.posts.map((item) => item.id));
      for (const post of incoming.posts) {
        if (seenPosts.has(post.id) || !seenProfiles.has(post.authorProfileId)) continue;
        merged.posts.push(post);
        seenPosts.add(post.id);
      }
      const seenReactions = new Set(merged.reactions.map((item) => `${item.actorProfileId}:${item.postId}`));
      for (const reaction of incoming.reactions) {
        const key = `${reaction.actorProfileId}:${reaction.postId}`;
        if (seenReactions.has(key) || !seenPosts.has(reaction.postId)) continue;
        merged.reactions.push(reaction);
        seenReactions.add(key);
      }
      const seenReports = new Set(merged.reports.map((item) => item.id));
      for (const report of incoming.reports) {
        if (seenReports.has(report.id)) continue;
        merged.reports.push(report);
      }
      const seenBlocks = new Set(merged.blocks.map((item) => `${item.blockerProfileId}:${item.blockedProfileId}`));
      for (const block of incoming.blocks) {
        const key = `${block.blockerProfileId}:${block.blockedProfileId}`;
        if (seenBlocks.has(key)) continue;
        merged.blocks.push(block);
        seenBlocks.add(key);
      }
      if (!merged.activeProfileId) merged.activeProfileId = incoming.activeProfileId;
      validateState(merged);
      return { state: merged, mode: "merge" };
    }
    return { state: incoming, mode: "replace" };
  }

  function serialize(state) {
    return JSON.stringify(exportBundle(state), null, 2);
  }

  function parse(text) {
    const bundle = typeof text === "string" ? JSON.parse(text) : text;
    return importBundle(emptyState(), bundle).state;
  }

  const api = {
    STORAGE_KEY,
    MODE,
    REACTION_KINDS,
    REPORT_REASONS,
    LIMITS,
    DomainError,
    emptyState,
    createState,
    createId,
    pairBlocked,
    hiddenProfileIds,
    canSeeProfile,
    canSeePost,
    canSeeReaction,
    visibleProfiles,
    visibleFeed,
    visibleReactions,
    visibleReports,
    viewerSnapshot,
    createProfile,
    updateProfile,
    setActiveProfile,
    createPost,
    deletePost,
    react,
    report,
    block,
    unblock,
    fixtureCatalog,
    loadFixtures,
    exportBundle,
    importBundle,
    serialize,
    parse,
    validateState,
  };

  const root = typeof globalThis !== "undefined" ? globalThis : undefined;
  if (root) root.AliaSpacesLocal = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
