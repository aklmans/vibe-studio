import assert from "node:assert/strict";
import test from "node:test";
import { diffConfigProposal, summarizeConfigProposal } from "./config-proposal";

const base = JSON.stringify({
  version: 1,
  title: "A",
  subtitle: "S",
  author: "Me",
  profile: { avatarUrl: "/a.png", avatarVisible: true },
  cover: { visual: "avatar" },
  badges: ["x"],
  stack: ["a", "b"],
  socials: [],
  sections: [{ title: "1", bullets: [] }],
});

test("summarizeConfigProposal lists changed top-level v1 fields with array counts", () => {
  const proposed = JSON.stringify({
    ...JSON.parse(base),
    title: "B",
    stack: ["a", "b", "c"],
    sections: [
      { title: "1", bullets: [] },
      { title: "2", bullets: [] },
    ],
  });
  const result = summarizeConfigProposal(base, proposed);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const byField = Object.fromEntries(result.changes.map((c) => [c.field, c.count ?? null]));
  assert.deepEqual(Object.keys(byField).sort(), ["sections", "stack", "title"]);
  assert.equal(byField.title, null); // scalar → no count
  assert.equal(byField.stack, 3);
  assert.equal(byField.sections, 2);
});

test("summarizeConfigProposal returns no changes for an identical config", () => {
  const result = summarizeConfigProposal(base, base);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.changes, []);
});

test("summarizeConfigProposal ignores object key order for nested v1 fields", () => {
  const current = JSON.stringify({
    version: 1,
    profile: { avatarUrl: "/avatar.png", avatarVisible: true },
    cover: { visual: "avatar", portraitUrl: "/portrait.png" },
  });
  const proposed = JSON.stringify({
    version: 1,
    profile: { avatarVisible: true, avatarUrl: "/avatar.png" },
    cover: { portraitUrl: "/portrait.png", visual: "avatar" },
  });
  const result = summarizeConfigProposal(current, proposed);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.changes, []);
});

test("summarizeConfigProposal flags invalid / non-v1 proposals as not summarizable", () => {
  assert.deepEqual(summarizeConfigProposal(base, "{not json"), { ok: false });
  assert.deepEqual(summarizeConfigProposal(base, JSON.stringify({ title: "x" })), { ok: false });
  assert.deepEqual(summarizeConfigProposal(base, JSON.stringify({ version: 2, title: "x" })), { ok: false });
  assert.deepEqual(summarizeConfigProposal(base, JSON.stringify([1, 2, 3])), { ok: false });
});

test("summarizeConfigProposal treats an unparseable current projection as empty", () => {
  const proposed = JSON.stringify({ version: 1, title: "A" });
  const result = summarizeConfigProposal("{bad", proposed);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.changes.some((c) => c.field === "title"));
});

test("diffConfigProposal reports scalar add / remove / change with old → new + groups", () => {
  const cur = JSON.stringify({ version: 1, title: "A", subtitle: "S", author: "Me", badges: [], stack: [], socials: [], sections: [] });
  const prop = JSON.stringify({ version: 1, title: "B", subtitle: "", author: "Me", badges: [], stack: [], socials: [], sections: [] });
  const r = diffConfigProposal(cur, prop);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const byField = Object.fromEntries(r.fields.map((f) => [f.field, f]));
  assert.equal(byField.title.status, "changed");
  assert.equal(byField.title.oldValue, "A");
  assert.equal(byField.title.newValue, "B");
  assert.equal(byField.title.group, "identity");
  assert.equal(byField.subtitle.status, "removed"); // "S" → ""
  assert.equal(byField.author, undefined); // unchanged → not listed
});

test("diffConfigProposal does array diffs: counts + added / removed / changed", () => {
  const cur = JSON.stringify({ version: 1, title: "A", subtitle: "S", badges: ["claude"], stack: ["a", "b"], socials: [{ label: "GH", value: "x" }], sections: [{ title: "One", bullets: [] }, { title: "Two", bullets: [] }] });
  const prop = JSON.stringify({ version: 1, title: "A", subtitle: "S", badges: ["claude", "codex"], stack: ["a"], socials: [{ label: "GH", value: "y" }], sections: [{ title: "One", bullets: [] }, { title: "Two", bullets: [] }, { title: "Three", bullets: [] }] });
  const r = diffConfigProposal(cur, prop);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const byField = Object.fromEntries(r.fields.map((f) => [f.field, f]));
  assert.deepEqual(byField.badges.added, ["codex"]);
  assert.equal(byField.badges.oldCount, 1);
  assert.equal(byField.badges.newCount, 2);
  assert.equal(byField.badges.group, "assets");
  assert.deepEqual(byField.stack.removed, ["b"]);
  assert.deepEqual(byField.socials.changed, ["GH"]); // index 0 value changed
  assert.deepEqual(byField.sections.added, ["Three"]);
  assert.equal(byField.sections.group, "sections");
});

test("diffConfigProposal is order-independent on object keys (no false change)", () => {
  const cur = JSON.stringify({ version: 1, title: "A", subtitle: "S", cover: { visual: "avatar", portraitUrl: "/p.png" }, badges: [], stack: [], socials: [], sections: [] });
  const prop = JSON.stringify({ version: 1, subtitle: "S", title: "A", cover: { portraitUrl: "/p.png", visual: "avatar" }, sections: [], socials: [], stack: [], badges: [] });
  const r = diffConfigProposal(cur, prop);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(r.fields, []); // reordered keys → no change
});

test("diffConfigProposal summarizes object (cover) changes; flags invalid as not diffable", () => {
  const cur = JSON.stringify({ version: 1, title: "A", subtitle: "S", cover: { visual: "avatar" }, badges: [], stack: [], socials: [], sections: [] });
  const prop = JSON.stringify({ version: 1, title: "A", subtitle: "S", cover: { visual: "scene" }, badges: [], stack: [], socials: [], sections: [] });
  const cover = diffConfigProposal(cur, prop);
  assert.equal(cover.ok, true);
  if (cover.ok) {
    const f = cover.fields.find((x) => x.field === "cover");
    assert.equal(f?.status, "changed");
    assert.match(f?.newValue ?? "", /scene/);
    assert.equal(f?.group, "media");
  }
  assert.deepEqual(diffConfigProposal("{}", "{not json"), { ok: false });
  assert.deepEqual(diffConfigProposal("{}", JSON.stringify({ title: "x" })), { ok: false }); // no version
  assert.deepEqual(diffConfigProposal("{}", JSON.stringify([1])), { ok: false });
});

test("diffConfigProposal names the changed profile / cover subfields", () => {
  const cur = JSON.stringify({
    version: 1,
    title: "A",
    subtitle: "S",
    profile: { avatarUrl: "/old-avatar.png", avatarVisible: true },
    cover: { visual: "avatar", portraitUrl: "/old-portrait.png", sceneUrl: "/scene.png" },
    badges: [],
    stack: [],
    socials: [],
    sections: [],
  });
  const prop = JSON.stringify({
    version: 1,
    title: "A",
    subtitle: "S",
    profile: { avatarUrl: "/new-avatar.png", avatarVisible: false },
    cover: { visual: "avatar", portraitUrl: "/new-portrait.png", sceneUrl: "/scene.png" },
    badges: [],
    stack: [],
    socials: [],
    sections: [],
  });

  const result = diffConfigProposal(cur, prop);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const profile = result.fields.find((f) => f.field === "profile");
  const cover = result.fields.find((f) => f.field === "cover");
  assert.match(profile?.oldValue ?? "", /avatar.*old-avatar\.png/);
  assert.match(profile?.newValue ?? "", /avatar.*new-avatar\.png/);
  assert.match(profile?.oldValue ?? "", /visible.*shown/);
  assert.match(profile?.newValue ?? "", /visible.*hidden/);
  assert.doesNotMatch(cover?.oldValue ?? "", /visual/);
  assert.match(cover?.oldValue ?? "", /portrait.*old-portrait\.png/);
  assert.match(cover?.newValue ?? "", /portrait.*new-portrait\.png/);
});
