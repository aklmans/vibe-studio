import assert from "node:assert/strict";
import test from "node:test";
import {
  isPrivateImageValuePlaceholder,
  mergeAgentContentIntoConfig,
  privateSocialValuePlaceholderIndex,
  sanitizeConfigTextForProvider,
} from "./config-privacy";

// A stand-in for an uploaded personal photo — bytes that must never leave.
const AVATAR_URI = "data:image/png;base64,PRIVATEPHOTOBYTES==";

function parse(text: string): Record<string, unknown> {
  return JSON.parse(text) as Record<string, unknown>;
}

test("sanitize sends content only — identity, brand, and non-portable fields are all dropped", () => {
  const out = parse(
    sanitizeConfigTextForProvider(
      JSON.stringify({
        version: 1,
        title: "Keep",
        subtitle: "Keep",
        badges: ["a"],
        stack: ["ts"],
        sections: [{ title: "S", bullets: ["b"] }],
        // identity / brand — must never reach a provider
        author: "Aklman",
        profile: { avatarUrl: AVATAR_URI, avatarVisible: true },
        cover: { visual: "avatar", portraitUrl: AVATAR_URI },
        socials: [{ icon: "github", label: "GitHub", value: "secret-handle" }],
        // non-portable runtime/studio state
        obs: { password: "obs-secret" },
        theme: "dark",
      }),
    ),
  );
  assert.deepEqual(
    Object.keys(out).sort(),
    ["badges", "sections", "stack", "subtitle", "title", "version"].sort(),
  );
  const raw = JSON.stringify(out);
  for (const leak of ["Aklman", AVATAR_URI, "secret-handle", "obs-secret"]) {
    assert.equal(raw.includes(leak), false, `leaked: ${leak}`);
  }
});

test("sanitize on unparseable text yields a safe stub, never the raw text", () => {
  const out = sanitizeConfigTextForProvider("not json { data:image/png;base64,LEAK }");
  assert.equal(out.includes("LEAK"), false);
  assert.match(out, /Config unavailable/);
});

test("merge folds reply content onto the host config; identity + brand stay from the host", () => {
  const original = JSON.stringify({
    version: 1,
    title: "Old Title",
    subtitle: "Old",
    badges: [],
    stack: [],
    sections: [],
    author: "Host",
    profile: { avatarUrl: AVATAR_URI },
    socials: [{ icon: "github", label: "GitHub", value: "secret-handle" }],
  });
  // A model reply that — against instructions — also tried to change identity.
  const reply = JSON.stringify({
    version: 1,
    title: "New Title",
    subtitle: "New Topic",
    sections: [{ title: "Intro", bullets: ["hi"] }],
    author: "IMPOSTER",
    profile: { avatarUrl: "https://evil/x.png" },
    socials: [{ icon: "github", label: "GitHub", value: "hijacked" }],
  });
  const merged = parse(mergeAgentContentIntoConfig(original, reply));
  // Content taken from the reply.
  assert.equal(merged.title, "New Title");
  assert.equal(merged.subtitle, "New Topic");
  assert.deepEqual(merged.sections, [{ title: "Intro", bullets: ["hi"] }]);
  // Identity + brand locked to the host's originals — the reply cannot touch them.
  assert.equal(merged.author, "Host");
  assert.equal((merged.profile as Record<string, unknown>).avatarUrl, AVATAR_URI);
  assert.equal((merged.socials as { value: string }[])[0].value, "secret-handle");
});

test("merge keeps the original when the reply is unparseable", () => {
  const original = JSON.stringify({ version: 1, title: "Keep" });
  assert.match(mergeAgentContentIntoConfig(original, "not json"), /"title":\s*"Keep"/);
});

test("placeholder guards recognize the apply-path placeholders", () => {
  assert.equal(privateSocialValuePlaceholderIndex("__PRIVATE_SOCIAL_VALUE_2__"), 2);
  assert.equal(privateSocialValuePlaceholderIndex("real-handle"), null);
  assert.equal(isPrivateImageValuePlaceholder("__PRIVATE_IMAGE_avatar__"), true);
  assert.equal(isPrivateImageValuePlaceholder("/avatar.png"), false);
});
