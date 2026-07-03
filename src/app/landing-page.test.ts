import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import LandingPageClient from "./landing/LandingPageClient";
import { getLandingContent, imageSrcForTheme } from "./landing/content";
import type { Locale } from "../lib/i18n";
import type { SurfaceGalleryImage } from "./landing/content";

const PAGE_SRC = readFileSync(resolve("src/app/page.tsx"), "utf8");
const CLIENT_SRC = readFileSync(resolve("src/app/landing/LandingPageClient.tsx"), "utf8");
const CONTENT_SRC = readFileSync(resolve("src/app/landing/content.ts"), "utf8");
const PROVIDER_SRC = readFileSync(resolve("src/app/landing/LandingProvider.tsx"), "utf8");
const SURFACES_TABS_SRC = readFileSync(resolve("src/app/landing/SurfacesTabs.tsx"), "utf8");
const HANDOFF_SRC = readFileSync(resolve("src/app/landing/GetStartedHandoff.tsx"), "utf8");
const THEMED_PICTURE_SRC = readFileSync(resolve("src/app/landing/ThemedPicture.tsx"), "utf8");
const LAYOUT_SRC = readFileSync(resolve("src/app/layout.tsx"), "utf8");
const CLIENT_PAGE_SRC = readFileSync(resolve("src/app/client-page.tsx"), "utf8");
const DEMO_PAGE_PATH = resolve("src/app/demo/page.tsx");
const STUDIO_PAGE_PATH = resolve("src/app/studio/page.tsx");
const SKILL_MD_PATH = resolve("public/skill.md");

// CSS files — landing styles are split into per-section files under styles/.
const LANDING_CSS_DIR = "src/app/landing/styles";
const TOKENS_CSS = readFileSync(resolve(LANDING_CSS_DIR, "tokens.css"), "utf8");
const BASE_CSS = readFileSync(resolve(LANDING_CSS_DIR, "base.css"), "utf8");
const HEADER_CSS = readFileSync(resolve(LANDING_CSS_DIR, "header.css"), "utf8");
const SURFACES_CSS = readFileSync(resolve(LANDING_CSS_DIR, "surfaces.css"), "utf8");
const FAQ_CSS = readFileSync(resolve(LANDING_CSS_DIR, "faq.css"), "utf8");
const RESPONSIVE_CSS = readFileSync(resolve(LANDING_CSS_DIR, "responsive.css"), "utf8");
const LANDING_CSS_ENTRY = readFileSync(resolve(LANDING_CSS_DIR, "landing.css"), "utf8");

function renderLanding(locale: Locale = "en"): string {
  return renderToStaticMarkup(
    React.createElement(LandingPageClient, { initialLocale: locale }),
  );
}
const PRODUCT_ASSETS = [
  "public/product/vibe-coding-overlay-dark.png",
  "public/product/vibe-coding-overlay-light.png",
  "public/product/agent-proposal-dark.png",
  "public/product/agent-proposal-light.png",
  "public/product/json-drawer-review-dark.png",
  "public/product/json-drawer-review-light.png",
  "public/product/obs-main-screen-dark.png",
  "public/product/obs-main-screen-light.png",
  "public/product/vibe-coding-cover-dark.png",
  "public/product/vibe-coding-cover-light.png",
  "public/product/vibe-coding-poster-dark.png",
  "public/product/vibe-coding-poster-light.png",
  "public/product/vibe-coding-wallpaper-desktop-4k-dark.png",
  "public/product/vibe-coding-wallpaper-desktop-4k-light.png",
];

test("root route is a product landing page with public navigation and real export imagery", () => {
  const html = renderLanding("en");

  assert.match(html, /data-testid="landing-page"/);
  assert.match(html, /data-testid="landing-site-header"/);
  assert.match(html, /data-testid="landing-site-footer"/);
  assert.match(html, /href="https:\/\/aklman\.com"/);
  assert.match(html, /Aklman/);
  assert.match(html, /Vibe Coding Live/);

  // Desktop nav: section anchors + GitHub, no Workflow.
  assert.match(html, /data-testid="landing-desktop-nav"/);
  assert.match(html, /href="#features"/);
  assert.match(html, /href="#surfaces"/);
  assert.match(html, /href="#agent"/);
  assert.match(html, /href="#get-started"/);
  assert.match(html, /href="https:\/\/github\.com\/aklmans\/vibe-studio"/);
  assert.match(html, /Main site/);
  assert.doesNotMatch(html, /href="#workflow"/);
  assert.doesNotMatch(html, /https:\/\/github\.com\/aklmans\/Vibe-Coding-Live/);

  // Main-site entries must not carry main-site blog nav labels.
  assert.doesNotMatch(html, />Posts</);
  assert.doesNotMatch(html, />Works</);
  assert.doesNotMatch(html, />Sessions</);
  assert.doesNotMatch(html, />About</);

  // Hero communicates the broader live-graphics value, not just coding streams.
  assert.match(html, /Designed live graphics without fighting OBS/);
  assert.match(html, /Study With Me/);
  assert.match(html, /Coding With Me/);
  assert.match(html, /Build in Public/);
  assert.match(html, /gaming/);
  assert.match(html, /chat/);
  assert.match(html, /Try Demo/);
  assert.match(html, /Open Studio/);
  assert.match(html, /href="\/demo"/);
  assert.match(html, /href="\/studio"/);
  assert.match(html, /Copy agent prompt/);
  assert.match(html, /data-testid="landing-hero-copy-prompt"/);
  const heroActionsIndex = html.indexOf('class="akl-hero-actions"');
  const heroUtilityIndex = html.indexOf('class="akl-hero-utility"');
  const heroCopyIndex = html.indexOf('data-testid="landing-hero-copy-prompt"');
  assert.ok(heroActionsIndex >= 0, "primary hero actions should render");
  assert.ok(heroUtilityIndex > heroActionsIndex, "copy prompt should render after primary actions");
  assert.ok(heroCopyIndex > heroUtilityIndex, "copy prompt should live in the utility row");
  assert.equal(
    html.slice(heroActionsIndex, heroUtilityIndex).includes("landing-hero-copy-prompt"),
    false,
    "copy prompt should not be inside the primary CTA group",
  );
  // Hero proof chips — the draft → review → apply control story.
  assert.match(html, /data-testid="landing-hero-chips"/);
  assert.match(html, /Agent drafts/);
  assert.match(html, /You review/);
  assert.match(html, /You apply/);

  // Language and theme toggles exist.
  assert.match(html, /data-testid="landing-lang-toggle"/);
  assert.match(html, /data-testid="landing-theme-toggle"/);
  assert.match(
    CLIENT_SRC,
    /data-testid="landing-main-site-link"[\s\S]*data-testid="landing-lang-toggle"[\s\S]*data-testid="landing-theme-toggle"/,
  );

  // Feature content preserved.
  assert.match(html, /Designed live-room frame/);
  assert.match(html, /Session Config Agent/);
  assert.match(html, /Local-first Studio/);

  // Product images — the landing now defaults to the light theme (matching the
  // personal site), so SSR serves the light variants.
  assert.match(html, /src="\/product\/vibe-coding-overlay-light\.png"/);
  assert.match(html, /src="\/product\/agent-proposal-light\.png"/);
  assert.match(html, /src="\/product\/json-drawer-review-light\.png"/);
  assert.match(html, /src="\/product\/obs-main-screen-light\.png"/);
  assert.match(html, /src="\/product\/vibe-coding-overlay-light\.png"/);
  assert.match(html, /src="\/product\/vibe-coding-cover-light\.png"/);
  assert.match(html, /src="\/product\/vibe-coding-poster-light\.png"/);
  assert.match(html, /src="\/product\/vibe-coding-wallpaper-desktop-4k-light\.png"/);
  assert.match(html, /From one stream idea to a designed live room/);
  assert.match(html, /class="akl-surface-tablist"/);
  assert.match(html, /FAQ/);
  for (const asset of PRODUCT_ASSETS) {
    assert.equal(existsSync(resolve(asset)), true, `${asset} should be a public product image`);
  }

  // Surfaces preview keeps real workflow imagery.
  assert.match(html, /akl-surface-kind-wide/);
  assert.match(html, /data-surface-kind="wide"/);
  assert.match(html, /akl-surface-kind-gallery/);
  assert.match(html, /data-surface-kind="gallery"/);

  // Brand links back to the landing root, not to the main site (Main site
  // link is the sole aklman.com exit).
  assert.match(html, /class="akl-brand"[^>]*href="\/"/);

  // Theme toggle uses stable aria-label + aria-pressed (standard toggle
  // button semantics). Screen readers announce "Light theme, toggle button,
  // pressed/not pressed".
  assert.match(html, /aria-pressed=/);
  assert.match(CLIENT_SRC, /aria-pressed=\{theme === "light"\}/);
  assert.match(CLIENT_SRC, /themeToggleLabel/);

  // Mobile menu is present.
  assert.match(html, /data-testid="landing-mobile-menu"/);
  assert.match(html, /akl-mobile-nav/);

  // Header is fixed, nav has underline hover — CSS is in header.css.
  assert.match(HEADER_CSS, /\.akl-site-header\s*{[^}]*position: fixed/s);
  assert.match(HEADER_CSS, /\.akl-site-nav a::after/);
  assert.match(HEADER_CSS, /\.akl-lang-toggle,\s*\.akl-theme-toggle\s*{[^}]*border:\s*0;/s);

  // Anchor offset prevents fixed header from covering section headings.
  assert.match(BASE_CSS, /scroll-margin-top/);

  // Surface tabs use one consistent media frame — tokens in tokens.css.
  assert.match(TOKENS_CSS, /--akl-surface-media-ratio: 16 \/ 9/);

  // CSS is imported from external files in the server component, not inline
  // in the client component.
  assert.match(PAGE_SRC, /import.*styles\/landing\.css/);
  assert.doesNotMatch(CLIENT_SRC, /<style/);
  assert.doesNotMatch(CLIENT_SRC, /landingCss/);

  // page.tsx is a server component that reads the locale cookie and passes
  // it to the client component. It must not contain JSX markup.
  assert.match(PAGE_SRC, /import.*cookies.*from.*next\/headers/);
  assert.match(PAGE_SRC, /LANDING_LOCALE_KEY/);
  assert.match(PAGE_SRC, /initialLocale/);
  assert.match(PAGE_SRC, /LandingPageClient/);

  // Landing must not import the Studio builder (ClientPage / OverlayBuilderApp).
  assert.doesNotMatch(CLIENT_SRC, /import.*ClientPage/);
  assert.doesNotMatch(CLIENT_SRC, /import.*OverlayBuilderApp/);
});

test("landing page has bilingual zh/en content source", () => {
  // The content module exports getLandingContent and supports both locales.
  assert.match(CONTENT_SRC, /export function getLandingContent/);
  assert.match(CONTENT_SRC, /const enContent/);
  assert.match(CONTENT_SRC, /const zhContent/);
  assert.match(CONTENT_SRC, /contentByLocale/);

  // English content has the broad live-stream hero.
  assert.match(CONTENT_SRC, /Designed live graphics without fighting OBS/);
  assert.match(CONTENT_SRC, /Study With Me, Coding With Me, Build in Public/);

  // Chinese content has a proper Chinese hero, not a machine translation.
  assert.match(CONTENT_SRC, /不用和 OBS 较劲，也能有好看的直播画面/);

  // Both locales have the full set of sections (Workflow section removed).
  assert.match(CONTENT_SRC, /featuresEyebrow/);
  assert.match(CONTENT_SRC, /surfacesEyebrow/);
  assert.match(CONTENT_SRC, /agentEyebrow/);
  assert.match(CONTENT_SRC, /getStartedEyebrow/);
  assert.match(CONTENT_SRC, /faqTitle/);
  assert.match(CONTENT_SRC, /footerBrand/);
  assert.doesNotMatch(CONTENT_SRC, /workflowEyebrow/);
  assert.doesNotMatch(CONTENT_SRC, /workflowTitle/);

  // Chinese nav labels are proper Chinese, not English.
  assert.match(CONTENT_SRC, /功能/);
  assert.match(CONTENT_SRC, /工作室系统/);
  assert.match(CONTENT_SRC, /开始使用/);

  // Chinese FAQ has real questions in Chinese.
  assert.match(CONTENT_SRC, /Vibe Studio 是什么/);
  assert.match(CONTENT_SRC, /公开 Demo 连着我的私有直播吗/);

  // Chinese agent handoff prompts are in Chinese (route through /skill.md).
  assert.match(CONTENT_SRC, /先读 \/skill\.md/);

  // Locale type is imported from the shared i18n module.
  assert.match(CONTENT_SRC, /import type \{ Locale \} from/);

  // Gallery images are bilingual — alt text and labels differ per locale.
  assert.match(CONTENT_SRC, /galleryImagesForLocale/);
  assert.match(CONTENT_SRC, /galleryImagesForLocale\("en"\)/);
  assert.match(CONTENT_SRC, /galleryImagesForLocale\("zh"\)/);
  assert.match(CONTENT_SRC, /darkSrc/);
  assert.match(CONTENT_SRC, /lightSrc/);
  assert.match(CONTENT_SRC, /合成画面 · 1920×1080/);
  assert.match(CONTENT_SRC, /封面 · 1280×720/);
  assert.match(CONTENT_SRC, /Vibe Studio 合成画面导出/);

  // Gallery carousel aria-labels are bilingual (en + zh).
  assert.match(CONTENT_SRC, /galleryCarouselLabel/);
  assert.match(CONTENT_SRC, /galleryControlsLabel/);
  assert.match(CONTENT_SRC, /galleryPrevLabel/);
  assert.match(CONTENT_SRC, /galleryNextLabel/);
  assert.match(CONTENT_SRC, /Export asset carousel/);
  assert.match(CONTENT_SRC, /Previous export asset/);
  assert.match(CONTENT_SRC, /Next export asset/);
  assert.match(CONTENT_SRC, /导出资产轮播/);
  assert.match(CONTENT_SRC, /上一张导出资产/);
  assert.match(CONTENT_SRC, /下一张导出资产/);

  // Theme toggle uses a stable label (not directional) + aria-pressed.
  assert.match(CONTENT_SRC, /themeToggleLabel/);
  assert.match(CONTENT_SRC, /Light theme/);
  assert.match(CONTENT_SRC, /浅色主题/);
  assert.doesNotMatch(CONTENT_SRC, /themeToggleToLightLabel/);
  assert.doesNotMatch(CONTENT_SRC, /themeToggleToDarkLabel/);

  // Chinese showcase label is in Chinese, not English "overlay".
  assert.match(CONTENT_SRC, /showcaseLabel: "OBS 合成 · 主屏幕"/);

  // FAQ export-kit answer is product-facing, not internal-implementation.
  assert.match(CONTENT_SRC, /Export All does the whole package in one action/);
  assert.match(CONTENT_SRC, /Export All 会一次生成整套公开视觉资产/);
  assert.doesNotMatch(CONTENT_SRC, /Sidebar and bottom-bar sources remain available/);
});

test("landing product imagery switches between dark and light screenshots", () => {
  const content = getLandingContent("en");

  assert.equal(imageSrcForTheme(content.showcaseImage, "dark"), "/product/obs-main-screen-dark.png");
  assert.equal(imageSrcForTheme(content.showcaseImage, "light"), "/product/obs-main-screen-light.png");

  const cardsWithImages = content.surfaceCards.filter((card) => card.image);
  assert.equal(cardsWithImages.length, 3);
  assert.deepEqual(
    cardsWithImages.map((card) => imageSrcForTheme(card.image!, "dark")),
    [
      "/product/agent-proposal-dark.png",
      "/product/json-drawer-review-dark.png",
      "/product/obs-main-screen-dark.png",
    ],
  );
  assert.deepEqual(
    cardsWithImages.map((card) => imageSrcForTheme(card.image!, "light")),
    [
      "/product/agent-proposal-light.png",
      "/product/json-drawer-review-light.png",
      "/product/obs-main-screen-light.png",
    ],
  );

  const galleryCard = content.surfaceCards.find((card) => card.id === "export");
  assert.ok(galleryCard?.gallery);
  assert.deepEqual(
    galleryCard.gallery.map((img: SurfaceGalleryImage) => imageSrcForTheme(img, "dark")),
    [
      "/product/vibe-coding-overlay-dark.png",
      "/product/vibe-coding-cover-dark.png",
      "/product/vibe-coding-poster-dark.png",
      "/product/vibe-coding-wallpaper-desktop-4k-dark.png",
    ],
  );
  assert.deepEqual(
    galleryCard.gallery.map((img: SurfaceGalleryImage) => imageSrcForTheme(img, "light")),
    [
      "/product/vibe-coding-overlay-light.png",
      "/product/vibe-coding-cover-light.png",
      "/product/vibe-coding-poster-light.png",
      "/product/vibe-coding-wallpaper-desktop-4k-light.png",
    ],
  );
});

test("LandingProvider manages locale and theme with localStorage + cookie persistence", () => {
  // Provider is a client component.
  assert.match(PROVIDER_SRC, /^['"]use client['"]/m);

  // Exports useLanding hook + default provider.
  assert.match(PROVIDER_SRC, /export function useLanding/);
  assert.match(PROVIDER_SRC, /export default function LandingProvider/);

  // Persistence keys are separate from Studio's overlay-state.
  // The literal strings live in content.ts; LandingProvider imports the constants.
  assert.match(CONTENT_SRC, /vibe-landing-locale/);
  assert.match(CONTENT_SRC, /vibe-landing-theme/);
  assert.match(PROVIDER_SRC, /LANDING_LOCALE_KEY/);
  assert.match(PROVIDER_SRC, /LANDING_THEME_KEY/);

  // Toggle functions exist.
  assert.match(PROVIDER_SRC, /toggleLocale/);
  assert.match(PROVIDER_SRC, /toggleTheme/);

  // Theme is applied to <html> via data-landing-theme.
  assert.match(PROVIDER_SRC, /data-landing-theme/);

  // Locale is applied to <html lang> + data-landing-locale.
  assert.match(PROVIDER_SRC, /setAttribute\("lang"/);
  assert.match(PROVIDER_SRC, /data-landing-locale/);

  // Provider accepts initialLocale from the server component (cookie-based
  // SSR) and uses it as the initial state — no English flash for zh users.
  assert.match(PROVIDER_SRC, /initialLocale/);
  assert.match(PROVIDER_SRC, /useState<Locale>\(initialLocale\)/);

  // Provider writes a cookie on locale change so the next SSR render is
  // correct. This is the key mechanism that prevents the locale flash.
  assert.match(PROVIDER_SRC, /document\.cookie/);
  assert.match(PROVIDER_SRC, /LANDING_LOCALE_KEY/);

  // Provider still reads boot-script-set attributes after hydration for the
  // rare case where cookie and localStorage disagree.
  assert.match(PROVIDER_SRC, /getAttribute\("data-landing-locale"\)/);
  assert.match(PROVIDER_SRC, /getAttribute\("data-landing-theme"\)/);

  // The provider renders children via a render prop (so page.tsx can access
  // the context value without wrapping each section in a consumer).
  assert.match(PROVIDER_SRC, /children: \(value/);
});

test("landing CSS supports dark and light themes via data-landing-theme", () => {
  // Light theme tokens are the default — the base .akl-page block, aligned to
  // the personal site (#fafafa bg, #c95f3d accent).
  assert.match(TOKENS_CSS, /--akl-bg: #fafafa/);
  assert.match(TOKENS_CSS, /--akl-accent: #c95f3d/);

  // Dark theme tokens are defined under data-landing-theme="dark".
  assert.match(TOKENS_CSS, /\[data-landing-theme="dark"\]/);
  assert.match(TOKENS_CSS, /--akl-bg: #1a1a1a/);
  assert.match(TOKENS_CSS, /--akl-accent: #e8835b/);

  // Dark tokens have a single source — the combined selector list. No
  // standalone [data-landing-theme="dark"] fallback block (which was a
  // duplicate that could drift).
  const darkTokenBlocks = TOKENS_CSS.match(/--akl-bg: #1a1a1a/g);
  assert.equal(darkTokenBlocks?.length, 1, "dark --akl-bg should appear exactly once");

  // CSS is split into per-section files, aggregated by landing.css.
  assert.match(LANDING_CSS_ENTRY, /@import "\.\/tokens\.css"/);
  assert.match(LANDING_CSS_ENTRY, /@import "\.\/header\.css"/);
  assert.match(LANDING_CSS_ENTRY, /@import "\.\/surfaces\.css"/);
  assert.match(LANDING_CSS_ENTRY, /@import "\.\/responsive\.css"/);

  // landing.css comment correctly says it's imported by page.tsx, not
  // LandingPageClient.tsx.
  assert.match(LANDING_CSS_ENTRY, /page\.tsx/);
  assert.doesNotMatch(LANDING_CSS_ENTRY, /LandingPageClient/);

  // Layout.tsx has a boot script that sets data-landing-theme AND
  // data-landing-locale before hydration to prevent theme/locale flash.
  assert.match(LAYOUT_SRC, /data-landing-theme/);
  assert.match(LAYOUT_SRC, /data-landing-locale/);
  // The boot script uses the shared constants (not hardcoded string literals).
  assert.match(LAYOUT_SRC, /LANDING_THEME_KEY/);
  assert.match(LAYOUT_SRC, /LANDING_LOCALE_KEY/);
  assert.match(LAYOUT_SRC, /getLandingBootScript/);
  // The boot script sets <html lang> so screen readers see the right language.
  assert.match(LAYOUT_SRC, /setAttribute\("lang"/);
});

test("header height has a single source of truth via CSS variable", () => {
  // tokens.css defines --akl-fixed-header-height.
  assert.match(TOKENS_CSS, /--akl-fixed-header-height: 66px/);
  // header.css uses the variable, not a hardcoded pixel value.
  assert.match(HEADER_CSS, /min-height: var\(--akl-fixed-header-height\)/);
  assert.doesNotMatch(HEADER_CSS, /min-height: 84px/);
  assert.doesNotMatch(HEADER_CSS, /min-height: 88px/);
  // responsive.css overrides the variable for mobile, not the min-height.
  assert.match(RESPONSIVE_CSS, /--akl-fixed-header-height: 60px/);
  assert.doesNotMatch(RESPONSIVE_CSS, /\.akl-header-row\s*\{[^}]*min-height:\s*60px/);
  // anchor offset derives from the same variable.
  assert.match(TOKENS_CSS, /--akl-anchor-offset: calc\(var\(--akl-fixed-header-height\) \+ 16px\)/);
  // body padding-top uses the same variable.
  assert.match(BASE_CSS, /padding-top: var\(--akl-fixed-header-height\)/);
  // scroll-margin-top uses the anchor offset.
  assert.match(BASE_CSS, /scroll-margin-top: var\(--akl-anchor-offset\)/);
});

test("root layout must not read cookies/headers to protect static routes", () => {
  // layout.tsx must NOT import cookies() or headers() from next/headers.
  // Doing so would make /demo, /studio, /obs/*, and /api/* request-dynamic.
  // The locale boundary is: page.tsx (landing only) reads cookies for SSR
  // locale; layout.tsx stays static; boot script fixes <html lang>.
  assert.doesNotMatch(LAYOUT_SRC, /import.*cookies.*from.*next\/headers/);
  assert.doesNotMatch(LAYOUT_SRC, /import.*headers.*from.*next\/headers/);
  // layout.tsx must document this boundary so future maintainers don't
  // accidentally add cookies() here.
  assert.match(LAYOUT_SRC, /must NOT call cookies/);
  assert.match(LAYOUT_SRC, /request-dynamic/);
});

test("all landing images use theme-aware src (dark/light)", () => {
  // Verify every <img> in the rendered landing HTML references a product
  // screenshot with a -dark or -light suffix. This catches regressions
  // where a hardcoded dark src survives in a light-theme context.
  const html = renderLanding("en");
  const imgSrcs = [...html.matchAll(/src="(\/product\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(imgSrcs.length > 0, "landing should render at least one product image");
  for (const src of imgSrcs) {
    assert.ok(
      src.includes("-dark") || src.includes("-light"),
      `image src "${src}" should be theme-specific (-dark or -light)`,
    );
  }

  // Verify content.ts has dark/light pairs for every themed image.
  const content = getLandingContent("en");
  assert.equal(imageSrcForTheme(content.showcaseImage, "dark"), "/product/obs-main-screen-dark.png");
  assert.equal(imageSrcForTheme(content.showcaseImage, "light"), "/product/obs-main-screen-light.png");

  // Every surface card image and gallery image must have both dark + light.
  for (const card of content.surfaceCards) {
    if (card.image) {
      assert.ok(card.image.darkSrc, `card "${card.id}" image must have darkSrc`);
      assert.ok(card.image.lightSrc, `card "${card.id}" image must have lightSrc`);
    }
    if (card.gallery) {
      for (const img of card.gallery) {
        assert.ok(img.darkSrc, `gallery image in card "${card.id}" must have darkSrc`);
        assert.ok(img.lightSrc, `gallery image in card "${card.id}" must have lightSrc`);
      }
    }
  }
});

test("hero copy prompt feedback uses current locale labels", () => {
  // The copy handler reads c.copiedLabel / c.copyFailedLabel from the
  // current locale's content — not hardcoded English.
  const enContent = getLandingContent("en");
  const zhContent = getLandingContent("zh");
  assert.equal(enContent.copiedLabel, "Copied");
  assert.equal(enContent.copyFailedLabel, "Copy failed — select the prompt manually.");
  assert.equal(zhContent.copiedLabel, "已复制");
  assert.equal(zhContent.copyFailedLabel, "复制失败——请手动选择提示词。");
  // The client component uses these labels via closure, not DOM attributes.
  assert.match(CLIENT_SRC, /c\.copiedLabel/);
  assert.match(CLIENT_SRC, /c\.copyFailedLabel/);
});

test("Surfaces tabs use real ARIA tabs, not hidden radio + CSS :has()", () => {
  const html = renderLanding("en");

  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tab"/);
  assert.match(html, /role="tabpanel"/);
  assert.match(html, /aria-selected=/);
  assert.match(html, /aria-controls=/);
  assert.match(html, /aria-labelledby=/);

  assert.doesNotMatch(html, /name="akl-surface"/);
  assert.doesNotMatch(html, /type="radio"/);

  assert.match(SURFACES_TABS_SRC, /ArrowRight/);
  assert.match(SURFACES_TABS_SRC, /ArrowLeft/);
  assert.match(SURFACES_TABS_SRC, /Home/);
  assert.match(SURFACES_TABS_SRC, /End/);
  assert.match(SURFACES_TABS_SRC, /^['"]use client['"]/m);

  // SurfacesTabs now accepts i18n labels via props.
  assert.match(SURFACES_TABS_SRC, /tablistLabel/);
  assert.match(SURFACES_TABS_SRC, /panelEyebrow/);
  assert.match(SURFACES_TABS_SRC, /theme/);

  // Gallery carousel aria-labels are passed via props, not hardcoded.
  assert.match(SURFACES_TABS_SRC, /galleryCarouselLabel/);
  assert.match(SURFACES_TABS_SRC, /galleryControlsLabel/);
  assert.match(SURFACES_TABS_SRC, /galleryPrevLabel/);
  assert.match(SURFACES_TABS_SRC, /galleryNextLabel/);
  assert.match(SURFACES_TABS_SRC, /carouselLabel/);
  assert.match(SURFACES_TABS_SRC, /controlsLabel/);
  assert.match(SURFACES_TABS_SRC, /prevLabel/);
  assert.match(SURFACES_TABS_SRC, /nextLabel/);
  assert.doesNotMatch(SURFACES_TABS_SRC, /"Export asset carousel"/);
  assert.doesNotMatch(SURFACES_TABS_SRC, /"Previous export asset"/);
  assert.doesNotMatch(SURFACES_TABS_SRC, /"Next export asset"/);
});

test("Surfaces section tells the designed live-room workflow story, not an asset list", () => {
  const html = renderLanding("en");

  assert.match(html, /From one stream idea to a designed live room/);
  assert.match(html, /One session config flows through the useful parts/);
  assert.match(html, /Studio system/);

  assert.match(html, /Prepare with Agent/);
  assert.match(html, /Review safely/);
  assert.match(html, /Compose in OBS/);
  assert.match(html, /Export the kit/);

  assert.doesNotMatch(html, /class="akl-surface-tab[^"]*"[^>]*>Cover</);
  assert.doesNotMatch(html, /class="akl-surface-tab[^"]*"[^>]*>Poster</);
  assert.doesNotMatch(html, /class="akl-surface-tab[^"]*"[^>]*>Sidebar</);
  assert.doesNotMatch(html, /class="akl-surface-tab[^"]*"[^>]*>Bottom bar</);

  assert.doesNotMatch(html, /One session config, many broadcast assets/);
  assert.doesNotMatch(html, /class="akl-eyebrow">Surfaces</);
  assert.doesNotMatch(html, /Export surface/);

  assert.match(html, /Studio layer/);

  assert.match(html, /Natural-language brief becomes a structured live config/);
  assert.match(html, /Proposal enters a review drawer, never live state/);
  assert.match(html, /Overlay is a transparent UI frame, not a locked scene layout/);
  assert.match(html, /Overlay, cover, poster and wallpapers from one state/);
  assert.match(html, /Export All for the whole package before you go live/);

  assert.match(html, /class="akl-surface-gallery"/);
  assert.match(html, /akl-surface-preview akl-surface-preview-gallery/);
  assert.match(html, /class="akl-gallery-stage"/);
  assert.match(html, /class="akl-gallery-viewport"/);
  assert.match(html, /class="akl-gallery-meta"/);
  assert.match(html, /class="akl-gallery-controls"/);
  assert.match(html, /class="akl-gallery-button akl-gallery-prev"/);
  assert.match(html, /class="akl-gallery-button akl-gallery-next"/);
  assert.match(html, /class="akl-gallery-caption"/);
  assert.doesNotMatch(SURFACES_TABS_SRC, /akl-gallery-arrow/);
  assert.doesNotMatch(SURFACES_TABS_SRC, /akl-surface-gallery-label/);
  assert.match(html, /aria-roledescription="slide"/);
  assert.match(html, /Overlay · 1920×1080/);
  assert.match(html, /Cover · 1280×720/);
  assert.match(html, /Poster · 1920×1080/);
  assert.match(html, /Wallpaper · 3840×2160/);
  assert.match(SURFACES_CSS, /\.akl-surface-preview-gallery\s*\{[^}]*overflow:\s*visible;[^}]*aspect-ratio:\s*auto;/s);
});

test("landing images have width, height, loading, and decoding attributes", () => {
  const html = renderLanding("en");

  assert.match(
    html,
    /src="\/product\/obs-main-screen-light\.png"[^>]*width="1174"[^>]*height="660"[^>]*loading="eager"[^>]*decoding="async"/,
  );
  assert.match(html, /src="\/product\/agent-proposal-light\.png"[^>]*width="3960"[^>]*height="2128"[^>]*loading="lazy"[^>]*decoding="async"/);
  assert.match(html, /src="\/product\/json-drawer-review-light\.png"[^>]*width="3960"[^>]*height="2128"[^>]*loading="lazy"[^>]*decoding="async"/);
  assert.match(html, /src="\/product\/obs-main-screen-light\.png"[^>]*width="1174"[^>]*height="660"[^>]*loading="eager"[^>]*decoding="async"/);
  assert.match(html, /src="\/product\/vibe-coding-overlay-light\.png"[^>]*width="1920"[^>]*height="1080"[^>]*loading="eager"[^>]*decoding="async"/);
  assert.match(html, /src="\/product\/vibe-coding-cover-light\.png"[^>]*width="1280"[^>]*height="720"[^>]*loading="lazy"[^>]*decoding="async"/);
  assert.match(html, /src="\/product\/vibe-coding-poster-light\.png"[^>]*width="1920"[^>]*height="1080"[^>]*loading="lazy"[^>]*decoding="async"/);
  assert.match(html, /src="\/product\/vibe-coding-wallpaper-desktop-4k-light\.png"[^>]*width="3840"[^>]*height="2160"[^>]*loading="lazy"[^>]*decoding="async"/);
});

test("landing images use <picture> with AVIF and WebP sources for format negotiation", () => {
  const html = renderLanding("en");

  // Every product image is wrapped in <picture> with AVIF + WebP <source> tags.
  const pictureCount = (html.match(/<picture>/g) || []).length;
  assert.ok(pictureCount >= 7, `expected at least 7 <picture> elements, got ${pictureCount}`);

  // AVIF sources come before WebP sources (format preference order).
  // React renderToStaticMarkup uses srcSet (camelCase) in the HTML output.
  assert.match(html, /<source type="image\/avif" srcSet="[^"]*\.avif"/);
  assert.match(html, /<source type="image\/webp" srcSet="[^"]*\.webp"/);

  // Verify each AVIF source is followed by a WebP source for the same base name.
  const avifMatches = [...html.matchAll(/<source type="image\/avif" srcSet="(\/product\/[^"]+)\.avif"/g)];
  const webpMatches = [...html.matchAll(/<source type="image\/webp" srcSet="(\/product\/[^"]+)\.webp"/g)];
  assert.equal(avifMatches.length, webpMatches.length,
    "AVIF and WebP source counts should match");
  for (let i = 0; i < avifMatches.length; i++) {
    assert.equal(avifMatches[i][1], webpMatches[i][1],
      `AVIF and WebP base names should match at index ${i}: ${avifMatches[i][1]} vs ${webpMatches[i][1]}`);
  }

  // The <img> fallback still has the PNG src (not the AVIF/WebP src).
  assert.match(html, /src="\/product\/vibe-coding-overlay-light\.png"/);

  // ThemedPicture component exists and derives format paths from the PNG path.
  assert.match(THEMED_PICTURE_SRC, /<picture>/);
  assert.match(THEMED_PICTURE_SRC, /type="image\/avif"/);
  assert.match(THEMED_PICTURE_SRC, /type="image\/webp"/);
  assert.match(THEMED_PICTURE_SRC, /\.replace\(\/\\\.png\$\/, "\.avif"\)/);
  assert.match(THEMED_PICTURE_SRC, /\.replace\(\/\\\.png\$\/, "\.webp"\)/);
});

test("hero showcase image has fetchPriority=high for LCP optimization", () => {
  const html = renderLanding("en");

  // The hero (first above-the-fold) image should have fetchPriority=high.
  // React renderToStaticMarkup renders the prop name as fetchPriority (camelCase).
  const heroImgMatch = html.match(
    /src="\/product\/obs-main-screen-light\.png"[^>]*fetchPriority="high"/,
  );
  assert.ok(heroImgMatch, "hero showcase image should have fetchPriority=high");

  // Non-hero images should NOT have fetchPriority=high.
  const surfaceImgMatch = html.match(
    /src="\/product\/agent-proposal-light\.png"[^>]*fetchPriority="high"/,
  );
  assert.equal(surfaceImgMatch, null,
    "surface images should not have fetchPriority=high");

  // ThemedPicture supports the fetchPriority prop.
  assert.match(THEMED_PICTURE_SRC, /fetchPriority/);
});

test("AVIF and WebP files exist for every landing product image", () => {
  const content = getLandingContent("en");
  const allImages: Array<{ darkSrc: string; lightSrc: string }> = [];

  if (content.showcaseImage) allImages.push(content.showcaseImage);
  for (const card of content.surfaceCards) {
    if (card.image) allImages.push(card.image);
    if (card.gallery) {
      for (const img of card.gallery) {
        allImages.push({ darkSrc: img.darkSrc, lightSrc: img.lightSrc });
      }
    }
  }

  for (const img of allImages) {
    for (const src of [img.darkSrc, img.lightSrc]) {
      const pngPath = resolve(`public${src}`);
      const avifPath = resolve(`public${src.replace(/\.png$/, ".avif")}`);
      const webpPath = resolve(`public${src.replace(/\.png$/, ".webp")}`);
      assert.equal(existsSync(pngPath), true, `${pngPath} should exist`);
      assert.equal(existsSync(avifPath), true, `${avifPath} should exist`);
      assert.equal(existsSync(webpPath), true, `${webpPath} should exist`);
    }
  }
});

test("landing product image optimization workflow is scripted and documented", () => {
  const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };

  assert.equal(
    packageJson.scripts?.["landing:images"],
    "tsx scripts/optimize-landing-images.ts",
  );

  const scriptPath = resolve("scripts/optimize-landing-images.ts");
  assert.equal(existsSync(scriptPath), true, `${scriptPath} should exist`);
  const scriptSrc = existsSync(scriptPath) ? readFileSync(scriptPath, "utf8") : "";
  assert.match(scriptSrc, /getLandingContent/);
  assert.match(scriptSrc, /cwebp/);
  assert.match(scriptSrc, /avifenc/);

  const readmePath = resolve("public/product/README.md");
  assert.equal(existsSync(readmePath), true, `${readmePath} should exist`);
  const readme = existsSync(readmePath) ? readFileSync(readmePath, "utf8") : "";
  assert.match(readme, /pnpm landing:images/);
  assert.match(readme, /cwebp/);
  assert.match(readme, /avifenc/);
});

test("gallery caption is a position-aware index with current item highlighted", () => {
  const html = renderLanding("en");

  // Caption items are individual spans with data-current on the active one.
  // React renders data-current={true} as data-current="true".
  assert.match(html, /class="akl-gallery-caption-item"/);
  assert.match(html, /data-current="true"/);

  // The caption should NOT use the old arrow-joined string format.
  assert.doesNotMatch(html, /Overlay → Cover → Poster → Wallpaper/);

  // Each caption item shows only the asset name (before the " · " separator).
  const captionItems = [...html.matchAll(/class="akl-gallery-caption-item"[^>]*>([^<]+)</g)];
  assert.ok(captionItems.length >= 4, "gallery caption should have at least 4 items");
  const names = captionItems.map((m) => m[1]);
  assert.ok(names.includes("Overlay"), `caption should include "Overlay", got ${JSON.stringify(names)}`);
  assert.ok(names.includes("Cover"), `caption should include "Cover", got ${JSON.stringify(names)}`);
  assert.ok(names.includes("Poster"), `caption should include "Poster", got ${JSON.stringify(names)}`);
  assert.ok(names.includes("Wallpaper"), `caption should include "Wallpaper", got ${JSON.stringify(names)}`);

  // SurfacesTabs source uses the data-current attribute on the active item.
  assert.match(SURFACES_TABS_SRC, /akl-gallery-caption-item/);
  assert.match(SURFACES_TABS_SRC, /data-current=\{index === current/);

  // CSS highlights the current item with the text color.
  assert.match(SURFACES_CSS, /\.akl-gallery-caption-item\[data-current\]/);
});

test("FAQ answers linkify route references and repo URL inline", () => {
  const html = renderLanding("en");

  // FAQ answers contain <a class="akl-faq-link"> elements for /demo, /studio,
  // /skill.md, and the GitHub repo URL.
  assert.match(html, /class="akl-faq-link"/);

  // /studio should be linked in the "Can I still use this as a private studio?" answer.
  assert.match(html, /href="\/studio"[^>]*class="akl-faq-link"[^>]*>\/studio</);

  // /skill.md should be linked in the "Can an AI Agent set it up for me?" answer.
  assert.match(html, /href="\/skill\.md"[^>]*class="akl-faq-link"[^>]*>\/skill\.md</);

  // The GitHub repo URL should be linked in the "Where is the repo?" answer.
  assert.match(
    html,
    /href="https:\/\/github\.com\/aklmans\/vibe-studio"[^>]*class="akl-faq-link"[^>]*>https:\/\/github\.com\/aklmans\/vibe-studio</,
  );

  // The linkifier uses negative lookahead to avoid matching /demo inside
  // longer paths like /demo-something.
  assert.match(CLIENT_SRC, /FAQ_LINK_RE/);
  assert.match(CLIENT_SRC, /demo\(\?!\[/);

  // Chinese FAQ answers also get linkified.
  const htmlZh = renderLanding("zh");
  assert.match(htmlZh, /href="\/studio"[^>]*class="akl-faq-link"[^>]*>\/studio</);
  assert.match(htmlZh, /href="\/skill\.md"[^>]*class="akl-faq-link"[^>]*>\/skill\.md</);

  // FAQ link CSS exists with focus-visible.
  assert.match(FAQ_CSS, /\.akl-faq details p a/);
  assert.match(BASE_CSS, /\.akl-faq-link:focus-visible/);
});

test("metadata includes og:siteName for social sharing", () => {
  assert.match(LAYOUT_SRC, /siteName: "Vibe Studio"/);
  assert.match(LAYOUT_SRC, /openGraph:/);
  assert.match(LAYOUT_SRC, /opengraph\.jpg/);
});

test("reduced-motion and focus-visible CSS are present", () => {
  assert.match(RESPONSIVE_CSS, /prefers-reduced-motion:\s*reduce/);
  assert.match(BASE_CSS, /\.akl-hero-copy-prompt:focus-visible/);
  assert.match(BASE_CSS, /\.akl-agent-skill-note a:focus-visible/);
  assert.match(FAQ_CSS, /\.akl-faq summary:focus-visible/);
  assert.match(FAQ_CSS, /\.akl-faq-indicator/);
  assert.doesNotMatch(BASE_CSS, /float:\s*right/);
});

test("the AI / Agent section tells the three-step product story and safety claims", () => {
  const html = renderLanding("en");

  assert.match(html, /id="agent"/);
  assert.match(html, /data-testid="landing-agent-flow"/);
  assert.match(html, /data-testid="landing-agent-safety"/);

  assert.match(html, /AI prepares\. You review\. OBS renders\./i);
  assert.match(html, /Agent drafts a session config/i);
  assert.match(html, /Human reviews and applies/i);
  assert.match(html, /OBS renders browser sources/i);

  assert.match(html, /never auto-applied/i);
  assert.match(html, /API key belongs in your local\/private Studio env/i);

  assert.match(html, /review.*Apply/i);
  assert.match(html, /browser sources/i);
});

test("Get Started is an agent-ready handoff with dual-mode panel", () => {
  const html = renderLanding("en");

  assert.match(html, /Start with an agent-ready handoff\./i);
  assert.match(html, /id="get-started"/);
  assert.doesNotMatch(html, /Try the demo, then take the studio live\./i);

  assert.match(html, /data-testid="landing-handoff"/);
  assert.match(html, /data-testid="landing-agent-panel"/);
  assert.match(html, /data-testid="landing-human-panel"/);

  assert.match(html, /role="tablist"/);
  assert.match(html, /I.*m an Agent/);
  assert.match(html, /I.*m a Human/);

  assert.match(html, /Run local demo/);
  assert.match(html, /Configure AI provider/);
  assert.match(html, /Prepare OBS sources/);
  assert.match(html, /Understand the project/);

  assert.match(html, /Read \/skill\.md first/);
  assert.match(html, /README\.md/);
  assert.match(html, /AGENTS\.md/);
  assert.match(html, /pnpm/);
  assert.match(html, /\/demo/);
  assert.match(html, /OBS/);

  assert.match(html, /pnpm install/);
  assert.match(html, /pnpm dev/);
  assert.match(html, /\/obs\/overlay\?camera=empty/);
  assert.match(html, /\/obs\/overlay\?camera=avatar/);
  assert.match(html, /\/obs\/sidebar/);
  assert.match(html, /\/obs\/bottom-bar/);
  assert.match(html, /README on GitHub/);

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
  assert.match(skill, /API key stays in local\/private server env/i);
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
  assert.match(HANDOFF_SRC, /"copied"/);
  assert.match(HANDOFF_SRC, /"failed"/);
  assert.match(HANDOFF_SRC, /copyFailedLabel/);
  assert.match(HANDOFF_SRC, /navigator\.clipboard/);
  assert.match(HANDOFF_SRC, /ArrowRight/);
  assert.match(HANDOFF_SRC, /ArrowLeft/);
  assert.match(HANDOFF_SRC, /agentTabRef/);
  assert.match(HANDOFF_SRC, /humanTabRef/);
  assert.match(HANDOFF_SRC, /\.focus\(\)/);
  assert.match(HANDOFF_SRC, /^['"]use client['"]/m);

  // Handoff now accepts i18n label props.
  assert.match(HANDOFF_SRC, /agentTabLabel/);
  assert.match(HANDOFF_SRC, /copyPromptLabel/);
  assert.match(HANDOFF_SRC, /copiedLabel/);
  assert.match(HANDOFF_SRC, /copyFailedLabel/);
});

test("Agent handoff prompts route agents through /skill.md and keep secrets local/private", () => {
  // Hero copy button is handled entirely by React (closure + clipboard API).
  // No inline <script>, no dangerouslySetInnerHTML, and no dead data-*
  // attributes that used to feed the old inline script.
  assert.match(CLIENT_SRC, /onClick=\{copyHeroPrompt\}/);
  assert.doesNotMatch(CLIENT_SRC, /data-prompt=/);
  assert.doesNotMatch(CLIENT_SRC, /data-copied-label=/);
  assert.doesNotMatch(CLIENT_SRC, /data-failed-label=/);
  assert.doesNotMatch(CLIENT_SRC, /<script/);
  assert.doesNotMatch(CLIENT_SRC, /dangerouslySetInnerHTML/);
  assert.match(HANDOFF_SRC, /currentPrompt/);
  assert.match(CONTENT_SRC, /Copy agent prompt/);
  assert.match(CONTENT_SRC, /Read \/skill\.md first\./);
  assert.match(CONTENT_SRC, /SESSION_AGENT_API_KEY/);
  assert.match(CONTENT_SRC, /local\/private Studio env/);
  assert.match(CONTENT_SRC, /never expose API keys/i);
  assert.match(CONTENT_SRC, /JSON review\/apply/i);
  // Chinese copied/failed labels exist for the hero copy button.
  assert.match(CONTENT_SRC, /已复制/);
  assert.match(CONTENT_SRC, /复制失败——请手动选择提示词/);

  // Verify that the /skill.md entry exists in both languages
  const htmlZh = renderLanding("zh");
  const htmlEn = renderLanding("en");
  assert.match(htmlEn, /data-testid="landing-agent-skill-note"/);
  assert.match(htmlEn, /href="\/skill\.md"/);
  assert.match(htmlEn, /For AI setup, send your agent to \/skill\.md/);
  assert.match(htmlZh, /让 AI Agent 先读 \/skill\.md，它会按项目约定安装、运行和配置。/);

  // Verify Chinese old jargon is removed from runtime copy
  assert.doesNotMatch(htmlZh, /AI 直播图形/);
  assert.doesNotMatch(htmlZh, /编辑式框架/);
  assert.doesNotMatch(htmlZh, /编辑式直播图形/);
  assert.doesNotMatch(htmlZh, /导出套装/);
});

test("FAQ covers AI auto-apply safety plus demo / studio / OBS / export", () => {
  const html = renderLanding("en");

  assert.match(html, /What is Vibe Studio\?/i);
  assert.match(html, /Is it only for coding streams\?/i);
  assert.match(html, /Study With Me/i);
  assert.match(html, /gaming/i);
  assert.match(html, /Does the AI agent ever auto-apply changes\?/i);
  assert.match(html, /JSON review drawer/);
  assert.match(html, /never writes directly to OBS/i);
  assert.match(html, /Where does my API key go\?/i);
  assert.match(html, /local\/private Studio env/i);
  assert.match(html, /public demo never asks for your key/i);
  assert.match(html, /How do I use it with OBS\?/i);
  assert.match(html, /Where is the repo\?/i);
  assert.match(html, /https:\/\/github\.com\/aklmans\/vibe-studio/);
  assert.match(html, /Can an AI Agent set it up for me\?/i);
  assert.match(html, /\/skill\.md/);

  assert.match(html, /Is the public demo connected to my private stream\?/i);
  assert.match(html, /touch your OBS or database/i);
  assert.match(html, /Can I still use this as a private studio\?/i);
  assert.match(html, /public hosted demo cannot push to your OBS/i);
  assert.match(html, /Where is the real screen capture\?/i);
  assert.match(html, /Can I export the whole broadcast kit\?/i);
});

test("metadata reflects the product value and AI story for SEO and sharing", () => {
  assert.match(LAYOUT_SRC, /const DEFAULT_SITE_URL = "https:\/\/vibe-studio\.aklman\.com"/);
  assert.match(LAYOUT_SRC, /process\.env\.NEXT_PUBLIC_SITE_URL \?\? DEFAULT_SITE_URL/);
  assert.doesNotMatch(LAYOUT_SRC, /NEXT_PUBLIC_SITE_URL \?\? "http:\/\/localhost:3000"/);

  assert.match(LAYOUT_SRC, /title: "Vibe Studio — Designed live graphics without fighting OBS"/);
  assert.match(LAYOUT_SRC, /Study With Me, Coding With Me, Build in Public, gaming, chat/);
  assert.match(LAYOUT_SRC, /Agent drafts session copy and config/);
  assert.match(LAYOUT_SRC, /OBS stays flexible/);
  assert.match(LAYOUT_SRC, /review and apply/);

  assert.match(LAYOUT_SRC, /openGraph:/);
  assert.match(LAYOUT_SRC, /opengraph\.jpg/);
  assert.match(LAYOUT_SRC, /type: "website"/);

  assert.match(LAYOUT_SRC, /twitter:/);
  assert.match(LAYOUT_SRC, /summary_large_image/);
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
