import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import Page from "./page";

const PAGE_SRC = readFileSync(resolve("src/app/page.tsx"), "utf8");
const LAYOUT_SRC = readFileSync(resolve("src/app/layout.tsx"), "utf8");
const CLIENT_PAGE_SRC = readFileSync(resolve("src/app/client-page.tsx"), "utf8");
const DEMO_PAGE_PATH = resolve("src/app/demo/page.tsx");
const STUDIO_PAGE_PATH = resolve("src/app/studio/page.tsx");
const PRODUCT_ASSETS = [
  "public/product/vibe-coding-overlay.png",
  "public/product/vibe-coding-cover.png",
  "public/product/vibe-coding-poster.png",
  "public/product/vibe-coding-sidebar.png",
  "public/product/vibe-coding-bottom-bar.png",
];

test("root route is a product landing page with public navigation and real export imagery", () => {
  const html = renderToStaticMarkup(React.createElement(Page));

  assert.match(html, /data-testid="landing-page"/);
  assert.match(html, /data-testid="landing-site-header"/);
  assert.match(html, /data-testid="landing-site-footer"/);
  assert.match(html, /href="https:\/\/aklman\.com"/);
  assert.match(html, /Aklman/);
  assert.match(html, /Vibe Coding Live/);
  assert.match(html, /coding streams/);

  // Desktop nav is reduced to the 5 product-level items.
  assert.match(html, /data-testid="landing-desktop-nav"/);
  assert.match(html, /href="#product"/);
  assert.match(html, /href="#surfaces"/);
  assert.match(html, /href="#workflow"/);
  assert.match(html, /href="\/studio"/);
  assert.match(html, /href="https:\/\/github\.com\/aklmans\/Vibe-Coding-Live"/);
  assert.match(html, /data-testid="landing-demo-link"/);
  assert.match(html, /href="\/demo"/);
  assert.match(html, /Main site/);

  // Main-site entries must not carry main-site blog nav labels.
  assert.doesNotMatch(html, />Posts</);
  assert.doesNotMatch(html, />Works</);
  assert.doesNotMatch(html, />Sessions</);
  assert.doesNotMatch(html, />About</);

  // Hero communicates value, not just the product name.
  assert.match(html, /Broadcast graphics for coding streams/);
  assert.match(html, /Try Demo/);
  assert.match(html, /Open Studio/);

  // Feature content preserved.
  assert.match(html, /Live Overlay Builder/);
  assert.match(html, /Session Config Agent/);
  assert.match(html, /OBS-ready browser sources/);

  // Product images.
  assert.match(html, /src="\/product\/vibe-coding-overlay\.png"/);
  assert.match(html, /src="\/product\/vibe-coding-cover\.png"/);
  assert.match(html, /src="\/product\/vibe-coding-poster\.png"/);
  assert.match(html, /src="\/product\/vibe-coding-sidebar\.png"/);
  assert.match(html, /src="\/product\/vibe-coding-bottom-bar\.png"/);
  assert.match(html, /name="akl-surface"/);
  assert.match(html, /One session config, many broadcast assets/);
  assert.match(html, /class="akl-surface-tablist"/);
  assert.match(html, /FAQ/);
  for (const asset of PRODUCT_ASSETS) {
    assert.equal(existsSync(resolve(asset)), true, `${asset} should be a public product image`);
  }

  // Surfaces preview uses per-kind classes, not a single uniform ratio.
  assert.match(html, /akl-surface-kind-wide/);
  assert.match(html, /akl-surface-kind-tall/);
  assert.match(html, /akl-surface-kind-strip/);
  assert.match(html, /data-surface-kind="wide"/);
  assert.match(html, /data-surface-kind="tall"/);
  assert.match(html, /data-surface-kind="strip"/);

  // Mobile menu is present (not just display:none with no alternative).
  assert.match(html, /data-testid="landing-mobile-menu"/);
  assert.match(html, /akl-mobile-nav/);

  // Header is fixed, nav has underline hover, light button keeps dark ink.
  assert.match(PAGE_SRC, /\.akl-site-header\s*{[^}]*position: fixed/s);
  assert.match(PAGE_SRC, /\.akl-site-nav a::after/);
  assert.match(PAGE_SRC, /\.akl-page \.akl-button-light\s*{[^}]*color: #161513/s);

  // Anchor offset prevents fixed header from covering section headings.
  assert.match(PAGE_SRC, /scroll-margin-top/);

  // Per-surface aspect ratios in CSS (not a single 16\/10 for all).
  assert.match(PAGE_SRC, /aspect-ratio: 16 \/ 9/);
  assert.match(PAGE_SRC, /aspect-ratio: 470 \/ 760/);
  assert.match(PAGE_SRC, /aspect-ratio: 1856 \/ 180/);

  // Landing stays static — no builder import.
  assert.doesNotMatch(PAGE_SRC, /ClientPage/);
});

test("the AI / Agent section tells the three-step product story and safety claims", () => {
  const html = renderToStaticMarkup(React.createElement(Page));

  // The section exists with a test hook.
  assert.match(html, /id="agent"/);
  assert.match(html, /data-testid="landing-agent-flow"/);
  assert.match(html, /data-testid="landing-agent-safety"/);

  // Three-part proposition: AI prepares, human review, OBS renders.
  assert.match(html, /AI prepares\. You review\. OBS renders\./i);

  // The three steps are present.
  assert.match(html, /Agent drafts a session config/i);
  assert.match(html, /Human reviews and applies/i);
  assert.match(html, /OBS renders browser sources/i);

  // Safety: never auto-applied + key stays on server.
  assert.match(html, /never auto-applied/i);
  assert.match(html, /API key stays on the server/i);

  // Workflow copy reflects the review/apply path and OBS browser sources.
  assert.match(html, /Describe the session/);
  assert.match(html, /Review the config/);
  assert.match(html, /Connect OBS sources/);
  assert.match(html, /Export the kit/);
  assert.match(html, /review.*Apply/i);
  assert.match(html, /browser sources/i);
});

test("Get Started replaces Docs / Guide and exposes OBS routes", () => {
  const html = renderToStaticMarkup(React.createElement(Page));

  // Section renamed to Get started.
  assert.match(html, /Get started/);
  assert.match(html, /id="get-started"/);
  // The old Docs / Guide label must not survive as an eyebrow.
  assert.doesNotMatch(html, /Docs \/ Guide/);

  // Three onboarding steps with demo / studio / OBS routes.
  assert.match(html, /Try the demo, then take the studio live\./i);
  assert.match(html, /Open the public demo/);
  assert.match(html, /Run the private studio/);
  assert.match(html, /Add OBS browser sources/);
  assert.match(html, /\/obs\/overlay\?camera=empty/);
  assert.match(html, /\/obs\/overlay\?camera=avatar/);
  assert.match(html, /\/obs\/sidebar/);
  assert.match(html, /\/obs\/bottom-bar/);

  // pnpm dev present but not the hero of the section.
  assert.match(html, /pnpm dev/);
});

test("FAQ covers AI auto-apply safety plus demo / studio / OBS / export", () => {
  const html = renderToStaticMarkup(React.createElement(Page));

  // New AI safety question.
  assert.match(html, /Does the AI agent ever auto-apply changes\?/i);
  assert.match(html, /JSON review drawer/);
  assert.match(html, /never writes directly to OBS/i);

  // Original four questions preserved.
  assert.match(html, /Is the public demo connected to my private stream\?/i);
  assert.match(html, /Can I still use this as a private studio\?/i);
  assert.match(html, /Where is the real screen capture\?/i);
  assert.match(html, /Can I export the whole broadcast kit\?/i);
});

test("metadata reflects the product value and AI story for SEO and sharing", () => {
  // We assert against the layout source string rather than importing the
  // module, because layout.tsx imports globals.css which tsx cannot load in
  // the Node test runner. The source-string assertions are stable contracts.

  // Title carries the value proposition, not just the product name.
  assert.match(LAYOUT_SRC, /title: "Vibe Coding Live — Editorial broadcast graphics for coding streams"/);
  // Description mentions coding streams, OBS, and AI.
  assert.match(LAYOUT_SRC, /coding livestreams/);
  assert.match(LAYOUT_SRC, /OBS browser sources/);
  assert.match(LAYOUT_SRC, /Optional AI drafts the session config/);

  // OpenGraph updated.
  assert.match(LAYOUT_SRC, /openGraph:/);
  assert.match(LAYOUT_SRC, /Editorial broadcast graphics for coding streams/);
  assert.match(LAYOUT_SRC, /opengraph\.jpg/);
  assert.match(LAYOUT_SRC, /type: "website"/);

  // Twitter card updated with summary_large_image.
  assert.match(LAYOUT_SRC, /twitter:/);
  assert.match(LAYOUT_SRC, /summary_large_image/);
  assert.match(LAYOUT_SRC, /Editorial broadcast graphics for coding streams/);
});

test("the builder lives on /demo and opts into isolated demo mode", () => {
  assert.equal(existsSync(DEMO_PAGE_PATH), true, "src/app/demo/page.tsx should host the builder");
  const demoPageSrc = readFileSync(DEMO_PAGE_PATH, "utf8");

  assert.match(demoPageSrc, /<ClientPage demoMode/);
  assert.match(CLIENT_PAGE_SRC, /demoMode\?: boolean/);
  assert.match(CLIENT_PAGE_SRC, /<OverlayBuilderApp demoMode=\{demoMode\}/);
});

test("the private studio route hosts the full workspace without demo isolation", () => {
  assert.equal(existsSync(STUDIO_PAGE_PATH), true, "src/app/studio/page.tsx should host the private workspace");
  const studioPageSrc = readFileSync(STUDIO_PAGE_PATH, "utf8");

  assert.match(studioPageSrc, /<ClientPage \/>/);
  assert.doesNotMatch(studioPageSrc, /demoMode/);
});
