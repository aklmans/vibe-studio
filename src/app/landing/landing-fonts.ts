import localFont from "next/font/local";

/**
 * The site serif — 仓耳今楷 TsangerJinKai02 — the same face the personal site
 * (Zhaphar) uses for its wordmark and headings, so the landing reads as the same
 * brand. Subset to just the glyphs the landing copy uses (Latin + the CJK in
 * content.ts + punctuation), which shrinks the two weights from ~8.8MB each to
 * ~120KB each. If new heading glyphs are added to content.ts, re-subset with
 * pyftsubset (see the fonts/ directory) or a missing glyph will fall back.
 */
export const tsangerSerif = localFont({
  src: [
    { path: "./fonts/TsangerJinKai02-W04.subset.woff2", weight: "400", style: "normal" },
    { path: "./fonts/TsangerJinKai02-W05.subset.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-landing-serif",
  display: "swap",
  // next/font emits these UNQUOTED into the CSS variable, so every name must be
  // valid unquoted — no trailing digits (e.g. "Source Serif 4" would poison the
  // whole font-family). Quoted extras like "Source Serif 4" live in tokens.css.
  fallback: ["Noto Serif SC", "Songti SC", "Georgia", "serif"],
});
