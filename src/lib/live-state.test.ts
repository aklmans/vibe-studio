import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_STATE_BY_LOCALE } from "../types";
import {
  createLiveStateStore,
  normalizeLiveStatePayload,
} from "./live-state";

test("normalizeLiveStatePayload uses locale-specific defaults", () => {
  const snapshot = normalizeLiveStatePayload({
    locale: "en",
    state: {
      sidebar: {
        sections: [{ title: "Custom", bullets: ["One"] }],
      },
    },
  });

  assert.equal(snapshot.locale, "en");
  assert.equal(snapshot.state.sidebar.agendas.workbench.sections[0]?.title, "Custom");
  assert.equal(
    snapshot.state.cover.todayLabel,
    DEFAULT_STATE_BY_LOCALE.en.cover.todayLabel,
  );
});

test("live state store broadcasts normalized snapshots", () => {
  const store = createLiveStateStore();
  const revisions: number[] = [];
  const unsubscribe = store.subscribe((snapshot) => {
    revisions.push(snapshot.revision);
  });

  const next = store.set({
    locale: "zh",
    state: {
      stack: {
        items: ["OBS", "Next.js"],
      },
    },
  });

  unsubscribe();

  assert.deepEqual(next.state.stack.items.map((item) => item.label), ["OBS", "Next.js"]);
  assert.equal(next.state.stack.items[0].iconKey, "obs");
  assert.equal(store.get().revision, 1);
  assert.deepEqual(revisions, [1]);
});
