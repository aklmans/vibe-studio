import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_STATE } from "../types";
import { buildAgentPrompt } from "./agent-prompt";

test("buildAgentPrompt redacts social values in copy handoff prompts", () => {
  const prompt = buildAgentPrompt(
    {
      ...DEFAULT_STATE,
      cover: {
        ...DEFAULT_STATE.cover,
        socials: [
          { visible: true, iconKey: "github", iconMode: "mono", label: "GitHub", value: "private-handoff-social", customColor: "" },
        ],
      },
    },
    "prepare a stream",
    "Task: update sections",
  );

  assert.match(prompt, /__PRIVATE_SOCIAL_VALUE_0__/);
  assert.match(prompt, /keep those placeholders/);
  assert.equal(prompt.includes("private-handoff-social"), false);
});

test("buildAgentPrompt redacts an uploaded avatar (data: URI) in the handoff prompt", () => {
  const uploadedPhoto = "data:image/png;base64,HANDOFFPHOTOBYTES==";
  const prompt = buildAgentPrompt(
    { ...DEFAULT_STATE, cover: { ...DEFAULT_STATE.cover, avatarUrl: uploadedPhoto } },
    "prepare a stream",
    "",
  );
  // The base64 photo never appears in a prompt the user copies to an external tool.
  assert.equal(prompt.includes(uploadedPhoto), false);
  assert.match(prompt, /__PRIVATE_IMAGE_avatar__/);
});
