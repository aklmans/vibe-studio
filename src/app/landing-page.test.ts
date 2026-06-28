import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import Page from "./page";

const PAGE_SRC = readFileSync(resolve("src/app/page.tsx"), "utf8");
const SURFACES_TABS_SRC = readFileSync(resolve("src/app/landing/SurfacesTabs.tsx"), "utf8");
const LAYOUT_SRC = readFileSync(resolve("src/app/layout.tsx"), "utf8");
const CLIENT_PAGE_SRC = readFileSync(resolve("src/app/client-page.tsx"), "utf8");
const DEMO_PAGE_PATH = resolve("src/app/demo/page.tsx");
const STUDIO_PAGE_PATH = resolve("src/app/studio/page.tsx");
const PRODUCT_ASSETS = [
  "public/product/vibe-coding-overlay.png",
  "public/product/agent-proposal-dark.png",
  "public/product/json-drawer-review-dark.png",
  "public/product/obs-main-screen-dark.png",
  "public/product/broadcast-kit-dark.png",
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

  // Product images — hero overlay plus dark-mode workflow screenshots.
  assert.match(html, /src="\/product\/vibe-coding-overlay\.png"/);
  assert.match(html, /src="\/product\/agent-proposal-dark\.png"/);
  assert.match(html, /src="\/product\/json-drawer-review-dark\.png"/);
  assert.match(html, /src="\/product\/obs-main-screen-dark\.png"/);
  // Export the kit uses a gallery, not a single composite image.
  assert.match(html, /src="\/product\/vibe-coding-overlay-dark\.png"/);
  assert.match(html, /src="\/product\/vibe-coding-cover-dark\.png"/);
  assert.match(html, /src="\/product\/vibe-coding-poster-dark\.png"/);
  assert.match(html, /src="\/product\/vibe-coding-wallpaper-desktop-4k-dark\.png"/);
  assert.match(html, /From one idea to a broadcast-ready live studio/);
  assert.match(html, /class="akl-surface-tablist"/);
  assert.match(html, /FAQ/);
  for (const asset of PRODUCT_ASSETS) {
    assert.equal(existsSync(resolve(asset)), true, `${asset} should be a public product image`);
  }

  // Surfaces preview keeps real workflow imagery. Export the kit uses a gallery.
  assert.match(html, /akl-surface-kind-wide/);
  assert.match(html, /data-surface-kind="wide"/);
  assert.match(html, /akl-surface-kind-gallery/);
  assert.match(html, /data-surface-kind="gallery"/);
  assert.doesNotMatch(html, /src="\/product\/vibe-coding-bottom-bar-dark\.png"/);
  assert.doesNotMatch(html, /src="\/product\/vibe-coding-sidebar-dark\.png"/);

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

test("Surfaces tabs use real ARIA tabs, not hidden radio + CSS :has()", () => {
  const html = renderToStaticMarkup(React.createElement(Page));

  // ARIA tablist contract.
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tab"/);
  assert.match(html, /role="tabpanel"/);
  assert.match(html, /aria-selected=/);
  assert.match(html, /aria-controls=/);
  assert.match(html, /aria-labelledby=/);

  // The old radio pattern must be gone.
  assert.doesNotMatch(html, /name="akl-surface"/);
  assert.doesNotMatch(html, /class="akl-surface-input"/);
  assert.doesNotMatch(html, /type="radio"/);

  // The CSS :has(#surface-…:checked) pattern must be gone from page.tsx.
  assert.doesNotMatch(PAGE_SRC, /:has\(#surface-.*:checked\)/);

  // Keyboard contract exists in the client component source.
  assert.match(SURFACES_TABS_SRC, /ArrowRight/);
  assert.match(SURFACES_TABS_SRC, /ArrowLeft/);
  assert.match(SURFACES_TABS_SRC, /Home/);
  assert.match(SURFACES_TABS_SRC, /End/);

  // The component is a client component.
  assert.match(SURFACES_TABS_SRC, /^['"]use client['"]/m);
});

test("Surfaces section tells the broadcast workflow story, not an asset list", () => {
  const html = renderToStaticMarkup(React.createElement(Page));

  // Section heading + intro tell the product story.
  assert.match(html, /From one idea to a broadcast-ready live studio/);
  assert.match(html, /Describe the session once/);
  assert.match(html, /Let OBS own the real capture/);
  // Eyebrow upgraded from "Surfaces" to a product-level label.
  assert.match(html, /Studio system/);

  // Four tabs express product capabilities, not asset names.
  assert.match(html, /Prepare with Agent/);
  assert.match(html, /Review safely/);
  assert.match(html, /Compose in OBS/);
  assert.match(html, /Export the kit/);

  // The old asset-list tab names must not return as tab titles.
  // (Asset names like "Cover" may still appear inside copy, but not as
  //  the four tab labels that define the section.)
  assert.doesNotMatch(html, /class="akl-surface-tab[^"]*"[^>]*>Cover</);
  assert.doesNotMatch(html, /class="akl-surface-tab[^"]*"[^>]*>Poster</);
  assert.doesNotMatch(html, /class="akl-surface-tab[^"]*"[^>]*>Sidebar</);
  assert.doesNotMatch(html, /class="akl-surface-tab[^"]*"[^>]*>Bottom bar</);

  // The old section heading must not return.
  assert.doesNotMatch(html, /One session config, many broadcast assets/);
  // The old eyebrow must not return.
  assert.doesNotMatch(html, /class="akl-eyebrow">Surfaces</);
  // The old panel eyebrow must not return.
  assert.doesNotMatch(html, /Export surface/);

  // Each tab panel carries the "Studio layer" eyebrow.
  assert.match(html, /Studio layer/);

  // Agent prep story: natural-language → structured config.
  assert.match(html, /Natural-language brief becomes a structured config/);
  // Safe review story: never auto-applied, diff drawer.
  assert.match(html, /Proposal enters a review drawer, never live state/);
  // OBS composition story: transparent frame, real capture in OBS.
  assert.match(html, /Overlay is a transparent UI frame, not a locked layout/);
  // Export kit story: one config → full kit, Export All.
  assert.match(html, /Overlay, cover, poster and wallpapers from one state/);
  assert.match(html, /Desktop and mobile wallpaper variants stay aligned/);
  assert.match(html, /Export All for the whole package before you go live/);
  assert.doesNotMatch(html, /Cover, poster, sidebar, bottom bar, wallpapers from one state/);

  // Export the kit uses a carousel of 4 real export images with prev/next arrows.
  assert.match(html, /class="akl-surface-gallery"/);
  assert.match(html, /class="akl-gallery-viewport"/);
  assert.match(html, /class="akl-gallery-arrow akl-gallery-prev"/);
  assert.match(html, /class="akl-gallery-arrow akl-gallery-next"/);
  assert.match(html, /aria-label="Previous export asset"/);
  assert.match(html, /aria-label="Next export asset"/);
  assert.match(html, /aria-label="Export asset carousel"/);
  assert.match(html, /src="\/product\/vibe-coding-overlay-dark\.png"[^>]*width="1920"/);
  assert.match(html, /src="\/product\/vibe-coding-cover-dark\.png"[^>]*width="1280"/);
  assert.match(html, /src="\/product\/vibe-coding-poster-dark\.png"[^>]*width="1920"/);
  assert.match(html, /src="\/product\/vibe-coding-wallpaper-desktop-4k-dark\.png"[^>]*width="3840"/);
  // Each gallery item has a mono dimension label.
  assert.match(html, /Overlay · 1920×1080/);
  assert.match(html, /Cover · 1280×720/);
  assert.match(html, /Poster · 1920×1080/);
  assert.match(html, /Wallpaper · 3840×2160/);
  // Carousel slides have aria-roledescription="slide".
  assert.match(html, /aria-roledescription="slide"/);
  // Keyboard contract exists in the component source.
  assert.match(SURFACES_TABS_SRC, /GalleryCarousel/);
  assert.match(SURFACES_TABS_SRC, /aria-label="Export asset carousel"/);
});

test("landing images have width, height, loading, and decoding attributes", () => {
  const html = renderToStaticMarkup(React.createElement(Page));

  // Product hero image — eager + dimensions.
  assert.match(
    html,
    /src="\/product\/vibe-coding-overlay\.png"[^>]*width="1920"[^>]*height="1080"[^>]*loading="eager"[^>]*decoding="async"/,
  );

  // Surface tab images — lazy + dimensions. These are dark-mode product
  // screenshots for the workflow story (prepare/review/compose).
  assert.match(html, /src="\/product\/agent-proposal-dark\.png"[^>]*width="3960"[^>]*height="2128"[^>]*loading="lazy"[^>]*decoding="async"/);
  assert.match(html, /src="\/product\/json-drawer-review-dark\.png"[^>]*width="3960"[^>]*height="2128"[^>]*loading="lazy"[^>]*decoding="async"/);
  assert.match(html, /src="\/product\/obs-main-screen-dark\.png"[^>]*width="1174"[^>]*height="660"[^>]*loading="lazy"[^>]*decoding="async"/);

  // Export the kit carousel images — first slide eager, rest lazy.
  assert.match(html, /src="\/product\/vibe-coding-overlay-dark\.png"[^>]*width="1920"[^>]*height="1080"[^>]*loading="eager"[^>]*decoding="async"/);
  assert.match(html, /src="\/product\/vibe-coding-cover-dark\.png"[^>]*width="1280"[^>]*height="720"[^>]*loading="lazy"[^>]*decoding="async"/);
  assert.match(html, /src="\/product\/vibe-coding-poster-dark\.png"[^>]*width="1920"[^>]*height="1080"[^>]*loading="lazy"[^>]*decoding="async"/);
  assert.match(html, /src="\/product\/vibe-coding-wallpaper-desktop-4k-dark\.png"[^>]*width="3840"[^>]*height="2160"[^>]*loading="lazy"[^>]*decoding="async"/);
});

test("reduced-motion and focus-visible CSS are present", () => {
  // prefers-reduced-motion block in landing CSS.
  assert.match(PAGE_SRC, /prefers-reduced-motion:\s*reduce/);
  // FAQ summary focus-visible.
  assert.match(PAGE_SRC, /\.akl-faq summary:focus-visible/);
  // FAQ indicator uses a stable layout (not float).
  assert.match(PAGE_SRC, /\.akl-faq-indicator/);
  // No float-based indicator remains.
  assert.doesNotMatch(PAGE_SRC, /float:\s*right/);
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

  // Workflow title is the clearer version, not the old weak one.
  assert.match(html, /From session prep to OBS, in four steps/);
  assert.doesNotMatch(html, /Meets you where you stream/);
});

test("Get Started replaces Docs / Guide and exposes OBS routes", () => {
  const html = renderToStaticMarkup(React.createElement(Page));

  // Section renamed to Get started.
  assert.match(html, /Get started/);
  assert.match(html, /id="get-started"/);
  // The old Docs / Guide label must not survive as an eyebrow.
  assert.doesNotMatch(html, /Docs \/ Guide/);

  // CSS classes renamed from guide to get-started.
  assert.match(PAGE_SRC, /\.akl-get-started\b/);
  assert.match(PAGE_SRC, /\.akl-get-started-copy/);
  assert.match(PAGE_SRC, /\.akl-get-started-steps/);
  assert.match(PAGE_SRC, /\.akl-get-started-link/);
  // Old guide class names should not linger.
  assert.doesNotMatch(PAGE_SRC, /\.akl-guide\b/);
  assert.doesNotMatch(PAGE_SRC, /\.akl-guide-copy/);
  assert.doesNotMatch(PAGE_SRC, /\.akl-guide-link/);

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
