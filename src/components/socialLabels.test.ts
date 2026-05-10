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
  { visible: true, kind: "youtube", label: "YouTube", value: "https://www.youtube.com/@aklman2018", customColor: "" },
  { visible: true, kind: "blog", label: "Website", value: "https://aklman.com", customColor: "" },
  { visible: true, kind: "discord", label: "Discord", value: "https://discord.gg/UJjzvHck", customColor: "" },
  { visible: true, kind: "x", label: "X", value: "https://x.com/Aklman2018", customColor: "" },
  { visible: true, kind: "github", label: "GitHub", value: "https://github.com/aklmans", customColor: "" },
];

function asElement(node: ReactNode): ReactElement<{ children?: ReactNode; style?: CSSProperties }> {
  assert.ok(isValidElement(node));
  return node as ReactElement<{ children?: ReactNode; style?: CSSProperties }>;
}

function childrenOf(node: ReactNode): ReactNode[] {
  return [asElement(node).props.children].flat(Number.POSITIVE_INFINITY) as ReactNode[];
}

test("SocialList renders same-size label chips", () => {
  const state = {
    ...DEFAULT_STATE,
    cover: {
      ...DEFAULT_STATE.cover,
      socials: SOCIALS,
    },
  };
  const rows = childrenOf(SocialList({ state, size: "small" }));
  const sizes = rows.map((row) => {
    const label = childrenOf(row)[0];
    const style = asElement(label).props.style;
    return { width: style?.width, height: style?.height };
  });

  assert.deepEqual(sizes, [
    { width: 76, height: 22 },
    { width: 76, height: 22 },
    { width: 76, height: 22 },
    { width: 76, height: 22 },
    { width: 76, height: 22 },
  ]);
});

test("SocialCard renders same-size label chips", () => {
  const card = SocialCard({
    S: (n) => n,
    socials: SOCIALS,
    colors: DEFAULT_STATE.colors,
    fullWidth: true,
    t: (key) => key,
  });
  const rows = childrenOf(card).slice(1);
  const sizes = rows.map((row) => {
    const label = childrenOf(row)[0];
    const style = asElement(label).props.style;
    return { width: style?.width, height: style?.height };
  });

  assert.deepEqual(sizes, [
    { width: 132, height: 34 },
    { width: 132, height: 34 },
    { width: 132, height: 34 },
    { width: 132, height: 34 },
    { width: 132, height: 34 },
  ]);
});
