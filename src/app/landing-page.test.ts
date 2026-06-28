import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import Page from "./page";

const PAGE_SRC = readFileSync(resolve("src/app/page.tsx"), "utf8");
const SURFACES_TABS_SRC = readFileSync(resolve("src/app/landing/SurfacesTabs.tsx"), "utf8");
const HANDOFF_SRC = readFileSync(resolve("src/app/landing/GetStartedHandoff.tsx"), "utf8");
const LAYOUT_SRC = readFileSync(resolve("src/app/layout.tsx"), "utf8");
const CLIENT_PAGE_SRC = readFileSync(resolve("src/app/client-page.tsx"), "utf8");
const DEMO_PAGE_PATH = resolve("src/app/demo/page.tsx");
const STUDIO_PAGE_PATH = resolve("src/app/studio/page.tsx");
const SKILL_MD_PATH = resolve("public/skill.md");
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

  // Desktop nav stays light: product anchors + GitHub only. Demo / Studio CTAs live in the page body.
  assert.match(html, /data-testid="landing-desktop-nav"/);
  assert.match(html, /href="#product"/);
  assert.match(html, /href="#surfaces"/);
  assert.match(html, /href="#workflow"/);
  assert.match(html, /href="https:\/\/github\.com\/aklmans\/vibe-studio"/);
  assert.doesNotMatch(html, /data-testid="landing-demo-link"/);
  assert.match(html, /Main site/);
  assert.doesNotMatch(html, /https:\/\/github\.com\/aklmans\/Vibe-Coding-Live/);

  // Main-site entries must not carry main-site blog nav labels.
  assert.doesNotMatch(html, />Posts</);
  assert.doesNotMatch(html, />Works</);
  assert.doesNotMatch(html, />Sessions</);
  assert.doesNotMatch(html, />About</);

  // Hero communicates AI-native value.
  assert.match(html, /AI-prepared broadcast graphics for coding streams/);
  assert.match(html, /Try Demo/);
  assert.match(html, /Open Studio/);
  assert.match(html, /href="\/demo"/);
  assert.match(html, /href="\/studio"/);
  assert.match(html, /Copy Agent Setup Prompt/);
  assert.match(html, /data-testid="landing-hero-copy-prompt"/);
  // Hero proof chips.
  assert.match(html, /data-testid="landing-hero-chips"/);
  assert.match(html, /No auto-apply/);
  assert.match(html, /Transparent OBS frame/);
  assert.match(html, /Overlay \/ cover \/ poster \/ wallpapers/);

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

  // Surface tabs use one consistent media frame, including the export gallery.
  assert.match(PAGE_SRC, /--akl-surface-media-ratio: 16 \/ 9/);
  assert.match(PAGE_SRC, /\.akl-surface-preview,\s*\.akl-gallery-viewport\s*{[^}]*aspect-ratio: var\(--akl-surface-media-ratio\)/s);
  assert.match(PAGE_SRC, /\.akl-surface-gallery\s*{[^}]*display: block/s);
  assert.match(PAGE_SRC, /\.akl-gallery-arrow\s*{[^}]*position: absolute/s);
  assert.match(PAGE_SRC, /\.akl-surface-kind-wide\s*{[^}]*align-items: start/s);
  assert.match(PAGE_SRC, /\.akl-surface-kind-gallery\s*{[^}]*align-items: start/s);

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

test("Get Started is an agent-ready handoff with dual-mode panel", () => {
  const html = renderToStaticMarkup(React.createElement(Page));

  // Section heading upgraded.
  assert.match(html, /Start with an agent-ready handoff\./i);
  assert.match(html, /id="get-started"/);
  // Old heading must not return.
  assert.doesNotMatch(html, /Try the demo, then take the studio live\./i);

  // Handoff panel exists.
  assert.match(html, /data-testid="landing-handoff"/);
  assert.match(html, /data-testid="landing-agent-panel"/);
  assert.match(html, /data-testid="landing-human-panel"/);

  // Segmented control with ARIA tablist semantics.
  assert.match(html, /role="tablist"/);
  assert.match(html, /I.*m an Agent/);
  assert.match(html, /I.*m a Human/);
  assert.match(html, /aria-controls=/);
  assert.match(html, /aria-labelledby=/);

  // Agent mode is default (panel not hidden).
  assert.match(html, /aria-selected="true"[^>]*aria-controls="[^"]*agent"/);

  // Four task chips exist.
  assert.match(html, /Run local demo/);
  assert.match(html, /Configure AI provider/);
  assert.match(html, /Prepare OBS sources/);
  assert.match(html, /Understand the project/);

  // Prompt text includes key references.
  assert.match(html, /Read \/skill\.md first/);
  assert.match(html, /README\.md/);
  assert.match(html, /AGENTS\.md/);
  assert.match(html, /pnpm/);
  assert.match(html, /\/demo/);
  assert.match(html, /OBS/);

  // Human mode preserves checklist commands and OBS routes.
  assert.match(html, /pnpm install/);
  assert.match(html, /pnpm dev/);
  assert.match(html, /\/obs\/overlay\?camera=empty/);
  assert.match(html, /\/obs\/overlay\?camera=avatar/);
  assert.match(html, /\/obs\/sidebar/);
  assert.match(html, /\/obs\/bottom-bar/);
  assert.match(html, /README on GitHub/);

  // Old Docs / Guide label must not return.
  assert.doesNotMatch(html, /Docs \/ Guide/);
});

test("public skill.md is a concise AI Agent setup contract", () => {
  assert.equal(existsSync(SKILL_MD_PATH), true, "public/skill.md should be deployed as /skill.md");
  const skill = readFileSync(SKILL_MD_PATH, "utf8");
  const readme = readFileSync(resolve("README.md"), "utf8");
  const envExample = readFileSync(resolve(".env.example"), "utf8");

  assert.match(skill, /# Vibe Studio Agent Skill/);
  assert.match(skill, /Vibe Studio \/ Vibe Coding Live/);
  assert.match(skill, /https:\/\/github\.com\/aklmans\/vibe-studio/);
  assert.match(skill, /pnpm install/);
  assert.match(skill, /pnpm dev/);
  assert.match(skill, /\/demo/);
  assert.match(skill, /\/studio/);
  assert.match(skill, /AGENTS\.md/);
  assert.match(skill, /README\.md/);
  assert.match(skill, /src\/components\/OverlayBuilderApp\.tsx/);
  assert.match(skill, /src\/components\/live-data\//);
  assert.match(skill, /src\/lib\/live-studio-config\.ts/);
  assert.match(skill, /src\/lib\/session-agent\.ts/);
  assert.match(skill, /API key stays on the server/i);
  assert.match(skill, /localStorage/);
  assert.match(skill, /JSON review\/apply/i);
  assert.match(skill, /\/obs\/overlay\?camera=empty/);
  assert.match(skill, /\/obs\/overlay\?camera=avatar/);
  assert.match(skill, /\/obs\/sidebar/);
  assert.match(skill, /\/obs\/bottom-bar/);
  assert.match(skill, /live-session\.config\.json/);
  assert.match(skill, /portable core/);
  assert.match(skill, /runtime \/ OBS \/ localStorage \/ studio appearance/i);
  assert.match(skill, /pnpm typecheck/);
  assert.match(skill, /pnpm test/);
  assert.match(skill, /pnpm build/);
  assert.match(skill, /SESSION_AGENT_USER_AGENT=Vibe-Studio\/SessionConfigAgent/);
  assert.match(readme, /SESSION_AGENT_USER_AGENT=Vibe-Studio\/SessionConfigAgent/);
  assert.match(envExample, /SESSION_AGENT_USER_AGENT=Vibe-Studio\/SessionConfigAgent/);
  assert.doesNotMatch(`${skill}\n${readme}\n${envExample}`, /Vibe-Coding-Live\/SessionConfigAgent/);
  assert.ok(skill.split(/\r?\n/).length <= 180, "skill.md should stay concise for AI agents");
});

test("Get Started handoff copy logic is honest about success and failure", () => {
  // The client component source has honest copy states.
  assert.match(HANDOFF_SRC, /"copied"/);
  assert.match(HANDOFF_SRC, /"failed"/);
  assert.match(HANDOFF_SRC, /Copy failed/);
  assert.match(HANDOFF_SRC, /navigator\.clipboard/);
  // Keyboard support on the segmented control.
  assert.match(HANDOFF_SRC, /ArrowRight/);
  assert.match(HANDOFF_SRC, /ArrowLeft/);
  assert.match(HANDOFF_SRC, /agentTabRef/);
  assert.match(HANDOFF_SRC, /humanTabRef/);
  assert.match(HANDOFF_SRC, /\.focus\(\)/);
  // It is a client component.
  assert.match(HANDOFF_SRC, /^['"]use client['"]/m);
});

test("Agent handoff prompts route agents through /skill.md and keep secrets server-side", () => {
  assert.match(PAGE_SRC, /data-prompt=\{agentSetupPrompt\}/);
  assert.match(HANDOFF_SRC, /currentPrompt/);
  assert.match(PAGE_SRC, /Copy Agent Setup Prompt/);
  assert.match(readFileSync(resolve("src/app/landing/content.ts"), "utf8"), /Read \/skill\.md first\./);
  assert.match(readFileSync(resolve("src/app/landing/content.ts"), "utf8"), /SESSION_AGENT_API_KEY/);
  assert.match(readFileSync(resolve("src/app/landing/content.ts"), "utf8"), /server env/);
  assert.match(readFileSync(resolve("src/app/landing/content.ts"), "utf8"), /never expose API keys/i);
  assert.match(readFileSync(resolve("src/app/landing/content.ts"), "utf8"), /JSON review\/apply/i);
});

test("Hero copy prompt CTA reads as an available action, not disabled text", () => {
  assert.match(PAGE_SRC, /\.akl-hero-copy-prompt\s*{[^}]*color: var\(--akl-text\)/s);
  assert.match(PAGE_SRC, /\.akl-hero-copy-prompt\s*{[^}]*border-color: color-mix\(in srgb, var\(--akl-accent\) 45%, transparent\)/s);
  assert.doesNotMatch(PAGE_SRC, /\.akl-hero-copy-prompt\s*{[^}]*color: var\(--akl-text-muted\)/s);
});

test("FAQ covers AI auto-apply safety plus demo / studio / OBS / export", () => {
  const html = renderToStaticMarkup(React.createElement(Page));

  assert.match(html, /What is Vibe Studio\?/i);
  // New AI safety question.
  assert.match(html, /Does the AI agent ever auto-apply changes\?/i);
  assert.match(html, /JSON review drawer/);
  assert.match(html, /never writes directly to OBS/i);
  assert.match(html, /Where does my API key go\?/i);
  assert.match(html, /server-side/i);
  assert.match(html, /How do I use it with OBS\?/i);
  assert.match(html, /Where is the repo\?/i);
  assert.match(html, /https:\/\/github\.com\/aklmans\/vibe-studio/);
  assert.match(html, /Can an AI Agent set it up for me\?/i);
  assert.match(html, /\/skill\.md/);

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

  // Public metadata should default to the product domain, not localhost.
  assert.match(LAYOUT_SRC, /const DEFAULT_SITE_URL = "https:\/\/vibe-studio\.aklman\.com"/);
  assert.match(LAYOUT_SRC, /process\.env\.NEXT_PUBLIC_SITE_URL \?\? DEFAULT_SITE_URL/);
  assert.doesNotMatch(LAYOUT_SRC, /NEXT_PUBLIC_SITE_URL \?\? "http:\/\/localhost:3000"/);

  // Title carries the value proposition, not just the product name.
  assert.match(LAYOUT_SRC, /title: "Vibe Studio — AI-prepared broadcast graphics for coding livestreams"/);
  // Description mentions coding streams, OBS, and AI.
  assert.match(LAYOUT_SRC, /AI-prepared broadcast graphics/);
  assert.match(LAYOUT_SRC, /coding livestream studio/);
  assert.match(LAYOUT_SRC, /OBS browser sources/);
  assert.match(LAYOUT_SRC, /review and apply/);

  // OpenGraph updated.
  assert.match(LAYOUT_SRC, /openGraph:/);
  assert.match(LAYOUT_SRC, /AI-prepared broadcast graphics/);
  assert.match(LAYOUT_SRC, /opengraph\.jpg/);
  assert.match(LAYOUT_SRC, /type: "website"/);

  // Twitter card updated with summary_large_image.
  assert.match(LAYOUT_SRC, /twitter:/);
  assert.match(LAYOUT_SRC, /summary_large_image/);
  assert.match(LAYOUT_SRC, /AI-prepared broadcast graphics/);
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
