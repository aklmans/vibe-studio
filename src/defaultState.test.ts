import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_STATE_BY_LOCALE } from "./types";

test("zh defaults show the localized social links in display order", () => {
  assert.deepEqual(
    DEFAULT_STATE_BY_LOCALE.zh.cover.socials.map((social) => ({
      visible: social.visible,
      kind: social.kind,
      label: social.label,
      value: social.value,
    })),
    [
      {
        visible: true,
        kind: "bilibili",
        label: "B站",
        value: "Aklman",
      },
      {
        visible: true,
        kind: "blog",
        label: "个人网站",
        value: "aklman.com",
      },
      {
        visible: true,
        kind: "qq",
        label: "QQ群",
        value: "205359827",
      },
      {
        visible: true,
        kind: "wechat",
        label: "微信",
        value: "aklman1",
      },
      {
        visible: true,
        kind: "github",
        label: "GitHub",
        value: "aklmans",
      },
    ],
  );
});

test("en defaults show the localized social links in display order", () => {
  assert.deepEqual(
    DEFAULT_STATE_BY_LOCALE.en.cover.socials.map((social) => ({
      visible: social.visible,
      kind: social.kind,
      label: social.label,
      value: social.value,
    })),
    [
      {
        visible: true,
        kind: "youtube",
        label: "YouTube",
        value: "@aklman2018",
      },
      {
        visible: true,
        kind: "blog",
        label: "Website",
        value: "aklman.com",
      },
      {
        visible: true,
        kind: "discord",
        label: "Discord",
        value: "aklman",
      },
      {
        visible: true,
        kind: "x",
        label: "X",
        value: "@Aklman2018",
      },
      {
        visible: true,
        kind: "github",
        label: "GitHub",
        value: "aklmans",
      },
    ],
  );
});
