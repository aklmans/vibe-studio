import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import Page from "./page";

const PAGE_SRC = readFileSync(resolve("src/app/page.tsx"), "utf8");
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

  // Feature and workflow content preserved.
  assert.match(html, /Live Overlay Builder/);
  assert.match(html, /Session Config Agent/);
  assert.match(html, /OBS-ready browser sources/);
  assert.match(html, /Export cover \/ poster \/ sidebar \/ bottom bar \/ wallpapers/);
  assert.match(html, /Prepare session/);
  assert.match(html, /Design broadcast surfaces/);
  assert.match(html, /Connect OBS/);
  assert.match(html, /Export assets/);

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
