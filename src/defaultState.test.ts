import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_STATE_BY_LOCALE, DEMO_STATE_BY_LOCALE } from "./types";

test("zh defaults show the localized social links in display order", () => {
  assert.deepEqual(
    DEFAULT_STATE_BY_LOCALE.zh.cover.socials.map((social) => ({
      visible: social.visible,
      iconKey: social.iconKey,
      iconMode: social.iconMode,
      label: social.label,
      value: social.value,
    })),
    [
      {
        visible: true,
        iconKey: "bilibili",
        iconMode: "mono",
        label: "B站",
        value: "demo-live",
      },
      {
        visible: true,
        iconKey: "website",
        iconMode: "mono",
        label: "个人网站",
        value: "example.com",
      },
      {
        visible: true,
        iconKey: "qq",
        iconMode: "mono",
        label: "QQ群",
        value: "123456789",
      },
      {
        visible: true,
        iconKey: "wechat",
        iconMode: "mono",
        label: "微信",
        value: "demo-live",
      },
      {
        visible: true,
        iconKey: "github",
        iconMode: "mono",
        label: "GitHub",
        value: "demo-org/vibe-live",
      },
    ],
  );
});

test("en defaults show the localized social links in display order", () => {
  assert.deepEqual(
    DEFAULT_STATE_BY_LOCALE.en.cover.socials.map((social) => ({
      visible: social.visible,
      iconKey: social.iconKey,
      iconMode: social.iconMode,
      label: social.label,
      value: social.value,
    })),
    [
      {
        visible: true,
        iconKey: "youtube",
        iconMode: "mono",
        label: "YouTube",
        value: "@demo-live",
      },
      {
        visible: true,
        iconKey: "website",
        iconMode: "mono",
        label: "Website",
        value: "example.com",
      },
      {
        visible: true,
        iconKey: "discord",
        iconMode: "mono",
        label: "Discord",
        value: "demo-live",
      },
      {
        visible: true,
        iconKey: "x",
        iconMode: "mono",
        label: "X",
        value: "@demo_live",
      },
      {
        visible: true,
        iconKey: "github",
        iconMode: "mono",
        label: "GitHub",
        value: "demo-org/vibe-live",
      },
    ],
  );
});

test("studio defaults carry no personal identity", () => {
  const defaults = JSON.stringify(DEFAULT_STATE_BY_LOCALE);

  // The private studio's factory state belongs to nobody: no author name, no
  // avatar, no personal handles. Identity arrives via first-run setup / the
  // Brand layer.
  assert.doesNotMatch(defaults, /Aklman/i);
  assert.equal(DEFAULT_STATE_BY_LOCALE.zh.cover.hookText, "");
  assert.equal(DEFAULT_STATE_BY_LOCALE.en.cover.hookText, "");
  // The built-in illustration is the PRODUCT default portrait (author's call):
  // the camera avatar theme never degrades to a monogram placeholder.
  assert.equal(DEFAULT_STATE_BY_LOCALE.zh.cover.avatarUrl, "/avatar.png");
  assert.equal(DEFAULT_STATE_BY_LOCALE.en.cover.avatarUrl, "/avatar.png");
  assert.equal(DEFAULT_STATE_BY_LOCALE.en.cover.visual, "title");
  for (const privateValue of [
    ["aklman", ".com"].join(""),
    ["aklman", "1"].join(""),
    ["aklman", "s"].join(""),
    ["@", "aklman", "2018"].join(""),
    ["205", "359", "827"].join(""),
  ]) {
    assert.doesNotMatch(defaults, new RegExp(privateValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});

test("demo seed stays rich but avoids personal identity and handles", () => {
  const demo = JSON.stringify(DEMO_STATE_BY_LOCALE);

  // /demo is the showcase: a fully-dressed example stream with a fictional
  // host — rich content, but still nobody's real accounts.
  assert.equal(DEMO_STATE_BY_LOCALE.en.cover.title, "Building With Agents");
  assert.equal(DEMO_STATE_BY_LOCALE.en.cover.visual, "avatar");
  assert.equal(DEMO_STATE_BY_LOCALE.en.cover.avatarUrl, "/avatar.png");
  assert.ok(DEMO_STATE_BY_LOCALE.zh.cover.badges.some((badge) => badge.visible));
  assert.doesNotMatch(demo, /Aklman/i);
  for (const privateValue of [
    ["aklman", ".com"].join(""),
    ["@", "aklman", "2018"].join(""),
    ["205", "359", "827"].join(""),
  ]) {
    assert.doesNotMatch(demo, new RegExp(privateValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});
