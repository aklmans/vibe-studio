import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const srcRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const allowedRuntimeFiles = new Set([
  "lib/design-tokens.ts",
  "lib/theme.ts",
  "stateStorage.ts",
]);
const deprecatedAliases = [
  "cyan",
  "purple",
  "teal",
  "warm",
  "brandBlue",
  "uploadBlue",
  "focus",
] as const;
const aliasPattern = new RegExp(
  String.raw`\bUI_COLORS\.(${deprecatedAliases.join("|")})\b`,
  "g",
);

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = resolve(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) return collectSourceFiles(path);
    return /\.(ts|tsx)$/.test(path) ? [path] : [];
  });
}

test("deprecated UI_COLORS aliases do not appear in runtime source paths", () => {
  const offenders = collectSourceFiles(srcRoot).flatMap((path) => {
    const relativePath = relative(srcRoot, path);
    if (
      allowedRuntimeFiles.has(relativePath) ||
      /\.test\.tsx?$/.test(relativePath)
    ) {
      return [];
    }

    const content = readFileSync(path, "utf8");
    const matches = [...content.matchAll(aliasPattern)];
    return matches.map((match) => `${relativePath}: ${match[0]}`);
  });

  assert.deepEqual(offenders, []);
});

// Render code reads accent marks through editorialPalette()'s semantic *Mark
// tokens, never the legacy persisted color fields. These files are the only
// places allowed to touch the raw fields: the type/preset layer, the storage
// migration, the palette adapter itself, and the Settings color editor that
// edits them.
const accentFieldAllowedFiles = new Set([
  "lib/theme.ts",
  "stateStorage.ts",
  "components/lib/editorial-palette.ts",
  "components/SettingsDrawer.tsx",
]);
const accentFieldPattern = /\b(cyanAccent|pinkAccent|warmAccent)\b/g;

test("render code reads accent marks through the palette, not raw color fields", () => {
  const offenders = collectSourceFiles(srcRoot).flatMap((path) => {
    const relativePath = relative(srcRoot, path);
    if (
      accentFieldAllowedFiles.has(relativePath) ||
      /\.test\.tsx?$/.test(relativePath)
    ) {
      return [];
    }

    const content = readFileSync(path, "utf8");
    const matches = [...content.matchAll(accentFieldPattern)];
    return matches.map((match) => `${relativePath}: ${match[0]}`);
  });

  assert.deepEqual(offenders, []);
});
