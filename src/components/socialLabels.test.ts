import assert from "node:assert/strict";
import test from "node:test";
import React, {
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { DEFAULT_STATE } from "../types";
import type { SocialConfig } from "../lib/socials";
import SocialList from "./SocialList";
import SocialCard from "./shared/SocialCard";

(
  globalThis as typeof globalThis & {
    React: typeof React;
  }
).React = React;

const SOCIALS: SocialConfig[] = [
  { visible: true, iconKey: "youtube", iconMode: "mono", label: "YouTube", value: "https://www.youtube.com/@aklman2018", customColor: "" },
  { visible: true, iconKey: "website", iconMode: "mono", label: "Website", value: "https://aklman.com", customColor: "" },
  { visible: true, iconKey: "discord", iconMode: "mono", label: "Discord", value: "https://discord.gg/UJjzvHck", customColor: "" },
  { visible: true, iconKey: "x", iconMode: "mono", label: "X", value: "https://x.com/Aklman2018", customColor: "" },
  { visible: true, iconKey: "github", iconMode: "mono", label: "GitHub", value: "https://github.com/aklmans", customColor: "" },
];

function asElement(node: ReactNode): ReactElement<{ children?: ReactNode; style?: CSSProperties }> {
  assert.ok(isValidElement(node));
  return node as ReactElement<{ children?: ReactNode; style?: CSSProperties }>;
}

function childrenOf(node: ReactNode): ReactNode[] {
  return [asElement(node).props.children].flat(Number.POSITIVE_INFINITY) as ReactNode[];
}

function editableCommitOf(node: ReactNode): (next: string) => void {
  const element = asElement(node) as ReactElement<{
    onCommit?: (next: string) => void;
  }>;
  const onCommit = element.props.onCommit;
  assert.ok(onCommit);
  return onCommit;
}

test("SocialList renders plain-text labels in an aligned column, not button chips", () => {
  const state = {
    ...DEFAULT_STATE,
    cover: {
      ...DEFAULT_STATE.cover,
      socials: SOCIALS,
    },
  };
  const rows = childrenOf(SocialList({ state, size: "small" }));
  for (const row of rows) {
    const style = asElement(childrenOf(row)[0]).props.style ?? {};
    // No button chrome…
    assert.equal(style.border, undefined);
    assert.equal(style.borderRadius, undefined);
    assert.equal(style.background, undefined);
    assert.equal(style.height, undefined);
    // …small-caps mono in a fixed-width column so values line up.
    assert.equal(style.textTransform, "uppercase");
    assert.equal(style.width, 76);
  }
});

test("SocialList makes values visually stronger than platform labels", () => {
  const state = {
    ...DEFAULT_STATE,
    cover: {
      ...DEFAULT_STATE.cover,
      socials: SOCIALS,
    },
  };
  const firstRow = childrenOf(SocialList({ state, size: "small" }))[0];
  const [label, value] = childrenOf(firstRow);
  const labelStyle = asElement(label).props.style;
  const valueStyle = asElement(value).props.style;

  assert.notEqual(labelStyle?.color, DEFAULT_STATE.colors.textColor);
  assert.equal(valueStyle?.color, DEFAULT_STATE.colors.textColor);
  assert.ok(Number(valueStyle?.fontWeight) > Number(labelStyle?.fontWeight));
});

test("SocialList edits the original social item when hidden rows precede it", () => {
  const socials: SocialConfig[] = [
    { visible: false, iconKey: "youtube", iconMode: "mono", label: "Hidden", value: "hidden", customColor: "" },
    { visible: true, iconKey: "website", iconMode: "mono", label: "Website", value: "https://example.com", customColor: "" },
    { visible: true, iconKey: "github", iconMode: "mono", label: "GitHub", value: "https://github.com/example", customColor: "" },
  ];
  let nextState = {
    ...DEFAULT_STATE,
    cover: {
      ...DEFAULT_STATE.cover,
      socials,
    },
  };

  const rows = childrenOf(
    SocialList({
      state: nextState,
      size: "small",
      editable: true,
      onChange: (state) => {
        nextState = state;
      },
    }),
  );
  const firstVisibleValue = childrenOf(rows[0])[1];
  const onCommit = editableCommitOf(firstVisibleValue);

  onCommit("https://zhaphar.com");

  assert.equal(nextState.cover.socials[0].value, "hidden");
  assert.equal(nextState.cover.socials[1].value, "https://zhaphar.com");
  assert.equal(nextState.cover.socials[2].value, "https://github.com/example");
});

test("SocialCard (stacked) renders a centered label/value grid, not chips", () => {
  const card = SocialCard({
    S: (n) => n,
    socials: SOCIALS,
    colors: DEFAULT_STATE.colors,
    variant: "stacked",
    t: (key) => key,
  });
  // Children: [FOLLOW ME eyebrow, grid]. The grid is centred and keeps each
  // label/value pair aligned on one row.
  const grid = asElement(childrenOf(card)[1]);
  assert.equal(grid.props.style?.display, "grid");
  assert.equal(grid.props.style?.justifyContent, "center");

  const firstLabelStyle = asElement(childrenOf(grid)[0]).props.style ?? {};
  assert.equal(firstLabelStyle.border, undefined);
  assert.equal(firstLabelStyle.background, undefined);
  assert.equal(firstLabelStyle.borderRadius, undefined);
  assert.equal(firstLabelStyle.textTransform, "uppercase");
});

test("SocialCard (horizontal) renders an inline rail, not a card", () => {
  const card = SocialCard({
    S: (n) => n,
    socials: SOCIALS,
    colors: DEFAULT_STATE.colors,
    variant: "horizontal",
    t: (key) => key,
  });
  // A wrapping flex rail of [eyebrow, pair, pair, …] — no grid card.
  assert.equal(asElement(card).props.style?.display, "flex");
  assert.equal(asElement(card).props.style?.flexWrap, "wrap");

  const [label, value] = childrenOf(childrenOf(card)[1]);
  const labelStyle = asElement(label).props.style ?? {};
  const valueStyle = asElement(value).props.style ?? {};
  assert.equal(labelStyle.border, undefined);
  assert.notEqual(labelStyle.color, DEFAULT_STATE.colors.textColor);
  assert.equal(valueStyle.color, DEFAULT_STATE.colors.textColor);
  assert.ok(Number(valueStyle.fontWeight) > Number(labelStyle.fontWeight));
});

test("SocialCard makes values visually stronger than platform labels", () => {
  const card = SocialCard({
    S: (n) => n,
    socials: SOCIALS,
    colors: DEFAULT_STATE.colors,
    variant: "stacked",
    t: (key) => key,
  });
  const cells = childrenOf(childrenOf(card)[1]);
  const labelStyle = asElement(cells[0]).props.style;
  const valueStyle = asElement(cells[1]).props.style;

  assert.notEqual(labelStyle?.color, DEFAULT_STATE.colors.textColor);
  assert.equal(valueStyle?.color, DEFAULT_STATE.colors.textColor);
  assert.ok(Number(valueStyle?.fontWeight) > Number(labelStyle?.fontWeight));
});
