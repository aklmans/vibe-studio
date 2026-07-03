import assert from "node:assert/strict";
import test from "node:test";
import {
  isPrivateImageValuePlaceholder,
  pickPortableV1FieldsInConfigText,
  privateImageValuePlaceholder,
  redactPrivateValuesInConfigText,
  restorePrivateValuesInConfigText,
  sanitizeConfigTextForProvider,
} from "./config-privacy";

// A stand-in for an uploaded personal photo — the bytes that must never leave.
const DATA_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const PORTRAIT_URI = "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";

function parse(text: string): Record<string, unknown> {
  return JSON.parse(text) as Record<string, unknown>;
}

test("redact replaces uploaded (data:) images with placeholders, keeps external URLs", () => {
  const out = parse(
    redactPrivateValuesInConfigText(
      JSON.stringify({
        version: 1,
        profile: { avatarUrl: DATA_URI, avatarVisible: true },
        cover: { visual: "avatar", portraitUrl: PORTRAIT_URI, sceneUrl: "/vibe-studio-bg.png" },
      }),
    ),
  );
  const profile = out.profile as Record<string, unknown>;
  const cover = out.cover as Record<string, unknown>;
  // The uploaded bytes are gone; the placeholder is deterministic per field.
  assert.equal(profile.avatarUrl, privateImageValuePlaceholder("avatar"));
  assert.equal(cover.portraitUrl, privateImageValuePlaceholder("portrait"));
  // An external URL is a cheap pointer, not personal bytes — it is preserved.
  assert.equal(cover.sceneUrl, "/vibe-studio-bg.png");
  // Non-image fields ride along untouched.
  assert.equal(profile.avatarVisible, true);
});

test("redact replaces social values with indexed placeholders", () => {
  const out = parse(
    redactPrivateValuesInConfigText(
      JSON.stringify({
        version: 1,
        socials: [
          { icon: "github", label: "GitHub", value: "secret-handle" },
          { icon: "website", label: "Site", value: "me.example" },
        ],
      }),
    ),
  );
  const socials = out.socials as { value: string }[];
  assert.equal(socials[0].value, "__PRIVATE_SOCIAL_VALUE_0__");
  assert.equal(socials[1].value, "__PRIVATE_SOCIAL_VALUE_1__");
});

test("restore swaps image + social placeholders back from the original", () => {
  const original = JSON.stringify({
    version: 1,
    profile: { avatarUrl: DATA_URI },
    cover: { portraitUrl: PORTRAIT_URI },
    socials: [{ icon: "github", label: "GitHub", value: "secret-handle" }],
  });
  // What an AI returns: placeholders kept, plus a genuinely new field it changed.
  const proposed = JSON.stringify({
    version: 1,
    title: "New Title",
    profile: { avatarUrl: privateImageValuePlaceholder("avatar") },
    cover: { portraitUrl: privateImageValuePlaceholder("portrait") },
    socials: [{ icon: "github", label: "GitHub", value: "__PRIVATE_SOCIAL_VALUE_0__" }],
  });
  const out = parse(restorePrivateValuesInConfigText(proposed, original));
  assert.equal((out.profile as Record<string, unknown>).avatarUrl, DATA_URI);
  assert.equal((out.cover as Record<string, unknown>).portraitUrl, PORTRAIT_URI);
  assert.equal((out.socials as { value: string }[])[0].value, "secret-handle");
  assert.equal(out.title, "New Title"); // AI edits outside placeholders survive
});

test("restore keeps an AI-provided replacement image instead of the placeholder", () => {
  const original = JSON.stringify({ version: 1, profile: { avatarUrl: DATA_URI } });
  const proposed = JSON.stringify({ version: 1, profile: { avatarUrl: "https://cdn.example/new.png" } });
  const out = parse(restorePrivateValuesInConfigText(proposed, original));
  assert.equal((out.profile as Record<string, unknown>).avatarUrl, "https://cdn.example/new.png");
});

test("pick drops non-portable fields (runtime + studio) and keeps the v1 core", () => {
  const out = parse(
    pickPortableV1FieldsInConfigText(
      JSON.stringify({
        version: 1,
        title: "Keep",
        subtitle: "Keep",
        author: "Keep",
        // None of these are part of the portable config — they must be dropped.
        bottomBar: { segments: [] },
        liveSession: { startedAt: "2026-01-01" },
        theme: "dark",
        colors: { accent: "#f00" },
        obs: { host: "localhost" },
        persistence: { databaseConfigured: true },
        secretlyInjected: "leak-me",
      }),
    ),
  );
  assert.deepEqual(Object.keys(out).sort(), ["author", "subtitle", "title", "version"].sort());
  for (const dropped of ["bottomBar", "liveSession", "theme", "colors", "obs", "persistence", "secretlyInjected"]) {
    assert.equal(dropped in out, false);
  }
});

test("sanitizeConfigTextForProvider strips non-portable fields AND redacts private values in one pass", () => {
  const sanitized = sanitizeConfigTextForProvider(
    JSON.stringify({
      version: 1,
      title: "T",
      profile: { avatarUrl: DATA_URI },
      cover: { portraitUrl: PORTRAIT_URI, sceneUrl: "/bg.png" },
      socials: [{ icon: "github", label: "GitHub", value: "secret-handle" }],
      obs: { host: "localhost", password: "should-never-appear" },
      persistence: { databaseUrl: "postgres://should-never-appear" },
    }),
  );
  // No uploaded image bytes, no social handle, no non-portable/secret-shaped keys.
  assert.equal(sanitized.includes(DATA_URI), false);
  assert.equal(sanitized.includes(PORTRAIT_URI), false);
  assert.equal(sanitized.includes("secret-handle"), false);
  assert.equal(sanitized.includes("should-never-appear"), false);
  assert.equal(sanitized.includes('"obs"'), false);
  assert.equal(sanitized.includes('"persistence"'), false);
  // The placeholders and portable content remain.
  assert.match(sanitized, /__PRIVATE_IMAGE_avatar__/);
  assert.match(sanitized, /__PRIVATE_SOCIAL_VALUE_0__/);
  assert.match(sanitized, /"sceneUrl": "\/bg\.png"/);
});

test("sanitize on unparseable text yields a safe stub, never the raw text", () => {
  const sanitized = sanitizeConfigTextForProvider("not json at all { data:image/png;base64,LEAK }");
  assert.equal(sanitized.includes("LEAK"), false);
  assert.match(sanitized, /Privacy-safe config unavailable/);
});

test("image placeholder round-trips through its guard", () => {
  assert.equal(isPrivateImageValuePlaceholder(privateImageValuePlaceholder("avatar")), true);
  assert.equal(isPrivateImageValuePlaceholder("/avatar.png"), false);
  assert.equal(isPrivateImageValuePlaceholder(DATA_URI), false);
});
