import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_STATE_BY_LOCALE } from "./types";

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
        value: "Aklman",
      },
      {
        visible: true,
        iconKey: "website",
        iconMode: "mono",
        label: "个人网站",
        value: "aklman.com",
      },
      {
        visible: true,
        iconKey: "qq",
        iconMode: "mono",
        label: "QQ群",
        value: "205359827",
      },
      {
        visible: true,
        iconKey: "wechat",
        iconMode: "mono",
        label: "微信",
        value: "aklman1",
      },
      {
        visible: true,
        iconKey: "github",
        iconMode: "mono",
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
        value: "@aklman2018",
      },
      {
        visible: true,
        iconKey: "website",
        iconMode: "mono",
        label: "Website",
        value: "aklman.com",
      },
      {
        visible: true,
        iconKey: "discord",
        iconMode: "mono",
        label: "Discord",
        value: "aklman",
      },
      {
        visible: true,
        iconKey: "x",
        iconMode: "mono",
        label: "X",
        value: "@Aklman2018",
      },
      {
        visible: true,
        iconKey: "github",
        iconMode: "mono",
        label: "GitHub",
        value: "aklmans",
      },
    ],
  );
});
