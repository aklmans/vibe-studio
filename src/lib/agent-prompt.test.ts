import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_STATE } from "../types";
import { buildAgentPrompt } from "./agent-prompt";

test("buildAgentPrompt sends stream content only — identity + brand never enter the handoff", () => {
  const uploadedPhoto = "data:image/png;base64,HANDOFFPHOTOBYTES==";
  const prompt = buildAgentPrompt(
    {
      ...DEFAULT_STATE,
      cover: {
        ...DEFAULT_STATE.cover,
        hookText: "with Private Author",
        avatarUrl: uploadedPhoto,
        socials: [
          { visible: true, iconKey: "github", iconMode: "mono", label: "GitHub", value: "private-handoff-social", customColor: "" },
        ],
      },
    },
    "prepare a stream",
    "Task: update sections",
  );

  // Nothing identity/brand appears in a prompt the user copies to an external tool.
  assert.equal(prompt.includes("private-handoff-social"), false);
  assert.equal(prompt.includes(uploadedPhoto), false);
  assert.equal(prompt.includes("Private Author"), false);
  // It states brand is fixed and asks only for the content shape.
  assert.match(prompt, /Identity and brand .* are fixed/);
  assert.match(prompt, /sections/);
});

test("prompts pin the output language deterministically (review P1-10)", () => {
  // CJK brief wins even in an EN locale; latin brief wins in a zh locale;
  // an empty brief falls back to the UI locale.
  assert.match(buildAgentPrompt(DEFAULT_STATE, "准备一场直播", "", "en"), /in Simplified Chinese/);
  assert.match(buildAgentPrompt(DEFAULT_STATE, "prepare a stream", "", "zh"), /in English/);
  assert.match(buildAgentPrompt(DEFAULT_STATE, "", "", "zh"), /in Simplified Chinese/);
  assert.match(buildAgentPrompt(DEFAULT_STATE, "", "", "en"), /in English/);
});

test("the handoff prompt declares the optional per-section speaker", () => {
  const prompt = buildAgentPrompt(DEFAULT_STATE, "", "", "en");
  assert.match(prompt, /sections: \[\{ title, minutes\?, speaker\?, speakerLines\?: string\[\], bullets\?: string\[\] \}\]/);
  assert.match(prompt, /speaker is the optional per-section presenter\/guest name/);
});
