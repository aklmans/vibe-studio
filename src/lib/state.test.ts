import assert from "node:assert/strict";
import test from "node:test";
import { patchSection, produceState } from "./state";

test("patchSection updates one nested object without mutating previous state", () => {
  const prev = {
    cover: { title: "Before", hookText: "with Aklman" },
    activeTab: "cover",
  };

  const next = patchSection(prev, "cover", { title: "After" });

  assert.equal(next.cover.title, "After");
  assert.equal(next.cover.hookText, "with Aklman");
  assert.equal(prev.cover.title, "Before");
  assert.notEqual(next, prev);
  assert.notEqual(next.cover, prev.cover);
});

test("produceState supports array updates without sharing mutated arrays", () => {
  const prev = {
    stack: { items: ["Claude", "React"] },
  };

  const next = produceState(prev, (draft) => {
    draft.stack.items[1] = "Vite";
  });

  assert.deepEqual(next.stack.items, ["Claude", "Vite"]);
  assert.deepEqual(prev.stack.items, ["Claude", "React"]);
});

