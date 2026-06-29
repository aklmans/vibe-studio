"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LandingProvider, { useLanding } from "./landing/LandingProvider";
import GetStartedHandoff from "./landing/GetStartedHandoff";
import SurfacesTabs from "./landing/SurfacesTabs";
import {
  GITHUB_PROFILE_URL,
  GITHUB_URL,
  imageSrcForTheme,
  MAIN_SITE_URL,
  RSS_URL,
  X_URL,
} from "./landing/content";

export default function LandingPage() {
  return (
    <LandingProvider>
      {(value) => (
        <main data-testid="landing-page" className="akl-page" data-landing-theme={value.theme}>
          <style>{landingCss}</style>
          <LandingPageContent />
        </main>
      )}
    </LandingProvider>
  );
}

function LandingPageContent() {
  const { content, locale, theme, toggleLocale, toggleTheme } = useLanding();
  const c = content;
  const mobileMenuRef = useRef<HTMLDetailsElement | null>(null);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copyPromptLabel, setCopyPromptLabel] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    };
  }, []);

  const closeMobileMenu = useCallback(() => {
    if (mobileMenuRef.current) mobileMenuRef.current.open = false;
  }, []);

  const showCopyFeedback = useCallback((label: string, timeoutMs: number) => {
    if (copyResetRef.current) clearTimeout(copyResetRef.current);
    setCopyPromptLabel(label);
    copyResetRef.current = setTimeout(() => {
      setCopyPromptLabel(null);
      copyResetRef.current = null;
    }, timeoutMs);
  }, []);

  const copyHeroPrompt = useCallback(() => {
    const text = c.agentSetupPrompt;
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).then(
        () => showCopyFeedback(c.copiedLabel, 2500),
        () => showCopyFeedback(c.copyFailedLabel, 3000),
      );
      return;
    }

    showCopyFeedback(c.copyFailedLabel, 3000);
  }, [c.agentSetupPrompt, c.copiedLabel, c.copyFailedLabel, showCopyFeedback]);

  return (
    <>
      <header data-testid="landing-site-header" className="akl-site-header">
        <div className="akl-shell akl-header-row">
          <a className="akl-brand" href={MAIN_SITE_URL} aria-label={c.mainSiteLabel}>
            {c.brand}
          </a>
          <nav
            className="akl-site-nav"
            aria-label="Vibe Coding Live navigation"
            data-testid="landing-desktop-nav"
          >
            {c.nav.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="akl-header-actions">
            <button
              type="button"
              className="akl-lang-toggle"
              data-testid="landing-lang-toggle"
              onClick={toggleLocale}
              aria-label={c.langToggleLabel}
            >
              {c.langToggleLabel}
            </button>
            <button
              type="button"
              className="akl-theme-toggle"
              data-testid="landing-theme-toggle"
              onClick={toggleTheme}
              aria-label={c.themeToggleLabel}
            >
              <svg
                className="akl-theme-icon-dark"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="3.5" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3" strokeLinecap="round" />
              </svg>
              <svg
                className="akl-theme-icon-light"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                aria-hidden="true"
              >
                <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" />
              </svg>
            </button>
            <a
              href={MAIN_SITE_URL}
              className="akl-main-site-link"
              data-testid="landing-main-site-link"
            >
              {c.mainSiteLabel}
            </a>
            <details
              ref={mobileMenuRef}
              className="akl-mobile-menu"
              data-testid="landing-mobile-menu"
            >
              <summary className="akl-mobile-toggle" aria-label={c.menuLabel}>
                <span>{c.menuLabel}</span>
                <i aria-hidden="true"></i>
              </summary>
              <nav className="akl-mobile-nav" aria-label={c.menuLabel}>
                {c.mobileNav.map((item) => (
                  <a key={item.label} href={item.href} onClick={closeMobileMenu}>
                    {item.label}
                  </a>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </header>

      <section id="product" className="akl-hero">
        <p className="akl-hero-wordmark">{c.wordmark}</p>
        <p className="akl-eyebrow">{c.eyebrow}</p>
        <h1>{c.h1}</h1>
        <p className="akl-hero-lede">{c.lede}</p>
        <div className="akl-hero-actions">
          <a href="/demo" className="akl-button akl-button-light">
            {c.tryDemo}
          </a>
          <a href="/studio" className="akl-button akl-button-dark">
            {c.openStudio}
          </a>
          <button
            type="button"
            className="akl-hero-copy-prompt"
            data-testid="landing-hero-copy-prompt"
            data-prompt={c.agentSetupPrompt}
            data-copied-label={c.copiedLabel}
            data-failed-label={c.copyFailedLabel}
            onClick={copyHeroPrompt}
          >
            {copyPromptLabel ?? c.copyAgentPrompt}
          </button>
        </div>
        <ul className="akl-hero-chips" data-testid="landing-hero-chips">
          {c.heroChips.map((chip) => (
            <li key={chip}>{chip}</li>
          ))}
        </ul>
        <p className="akl-hero-note">
          {c.heroNote} <a href={c.heroStudioLink}>{c.heroStudioLink}</a>.
          <br />
          <a href={GITHUB_URL} className="akl-hero-github">{c.viewGithub}</a>
        </p>
      </section>

      <section className="akl-showcase" aria-label={c.showcaseAlt}>
        <div data-testid="landing-product-preview" className="akl-product-frame">
          <div className="akl-window-top" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
            <b>{c.showcaseLabel}</b>
          </div>
          <img
            src={imageSrcForTheme(c.showcaseImage, theme)}
            alt={c.showcaseImage.alt}
            className="akl-overlay-img"
            width={c.showcaseImage.width}
            height={c.showcaseImage.height}
            loading="eager"
            decoding="async"
          />
        </div>
      </section>

      <section id="features" className="akl-section akl-split-section">
        <div>
          <p className="akl-eyebrow">{c.featuresEyebrow}</p>
          <h2>{c.featuresTitle}</h2>
        </div>
        <div className="akl-feature-list">
          {c.features.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="surfaces" className="akl-section akl-surface-tabs" aria-label={c.surfacesAriaLabel}>
        <p className="akl-eyebrow">{c.surfacesEyebrow}</p>
        <h2>{c.surfacesTitle}</h2>
        <p className="akl-surface-intro">{c.surfacesIntro}</p>
        <SurfacesTabs
          cards={c.surfaceCards}
          tablistLabel={c.surfacesAriaLabel}
          panelEyebrow={c.surfacePanelEyebrow}
          theme={theme}
        />
      </section>

      <section id="workflow" className="akl-section">
        <p className="akl-eyebrow">{c.workflowEyebrow}</p>
        <h2>{c.workflowTitle}</h2>
        <div className="akl-workflow-grid">
          {c.workflow.map((item, index) => (
            <article key={item.title} className="akl-workflow-card">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="agent" className="akl-section akl-agent" aria-label={c.agentEyebrow}>
        <p className="akl-eyebrow">{c.agentEyebrow}</p>
        <h2>{c.agentTitle}</h2>
        <p className="akl-agent-lede">{c.agentLede}</p>

        <ol className="akl-agent-flow" data-testid="landing-agent-flow">
          {c.agentFlow.map((item) => (
            <li key={item.step} className="akl-agent-step">
              <span className="akl-agent-step-num">{item.step}</span>
              <div className="akl-agent-step-body">
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </div>
            </li>
          ))}
        </ol>

        <ul className="akl-agent-safety" data-testid="landing-agent-safety">
          {c.agentSafety.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <p className="akl-agent-providers">{c.agentProviders}</p>
      </section>

      <section id="get-started" className="akl-section akl-get-started">
        <div className="akl-get-started-copy">
          <p className="akl-eyebrow">{c.getStartedEyebrow}</p>
          <h2>{c.getStartedTitle}</h2>
          <p>{c.getStartedLede}</p>
        </div>
        <GetStartedHandoff
          tasks={c.agentTasks}
          setupPrompt={c.agentSetupPrompt}
          humanItems={c.humanChecklist}
          githubUrl={GITHUB_URL}
          agentTabLabel={c.agentTabLabel}
          humanTabLabel={c.humanTabLabel}
          agentTasksLabel={c.agentTasksLabel}
          copyPromptLabel={c.copyPromptLabel}
          copiedLabel={c.copiedLabel}
          copyFailedLabel={c.copyFailedLabel}
          readmeGithub={c.readmeGithub}
          setupModeLabel={c.getStartedEyebrow}
        />
      </section>

      <section id="faq" className="akl-faq">
        <p className="akl-faq-mark">?</p>
        <h2>{c.faqTitle}</h2>
        <div className="akl-faq-list">
          {c.faqItems.map((item) => (
            <details key={item.question}>
              <summary>
                <span className="akl-faq-question">{item.question}</span>
                <span className="akl-faq-indicator" aria-hidden="true"></span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer data-testid="landing-site-footer" className="akl-site-footer">
        <div className="akl-shell akl-footer-row">
          <p>{c.footerBrand}</p>
          <nav aria-label="Footer links">
            <a href={MAIN_SITE_URL}>{c.mainSiteLabel}</a>
            <span aria-hidden="true">/</span>
            <a href={GITHUB_PROFILE_URL}>GitHub</a>
            <span aria-hidden="true">/</span>
            <a href={X_URL}>X</a>
            <span aria-hidden="true">/</span>
            <a href={RSS_URL}>RSS</a>
          </nav>
        </div>
      </footer>
    </>
  );
}

const landingCss = `
  .akl-page {
    --akl-fixed-header-height: 88px;
    --akl-anchor-offset: calc(var(--akl-fixed-header-height) + 16px);
    --akl-surface-media-ratio: 16 / 9;

    /* Dark theme (default) */
    --akl-border: #3a3832;
    --akl-border-subtle: #2f2d29;
    --akl-bg: #1a1a1a;
    --akl-surface: #20201e;
    --akl-text: #fafafa;
    --akl-text-muted: #9b958d;
    --akl-text-subtle: #7e776e;
    --akl-accent: #e8835b;
    --akl-paper: #f4efe6;
    --akl-paper-ink: #161513;
    --akl-page-color: #f4efe6;
    --akl-header-bg: color-mix(in srgb, #1a1a1a 92%, transparent);
    --akl-mobile-nav-bg: color-mix(in srgb, #1a1a1a 96%, transparent);
    --akl-product-bg: #171615;
    --akl-window-bg: #25231f;
    --akl-window-dot: #70695e;
    --akl-window-label: #8b847a;
    --akl-preview-bg: #151413;
    --akl-gallery-label-bg: color-mix(in srgb, #1a1a1a 85%, transparent);
    --akl-prompt-bg: #151413;
    --akl-prompt-text: #d8d0c4;
    --akl-hero-note-link: #aaa49b;
    --akl-hero-note-border: #4a463d;

    min-height: 100vh;
    padding-top: var(--akl-fixed-header-height);
    background: var(--akl-bg);
    color: var(--akl-page-color);
    font-family: var(--app-font-sans);
  }

  /* Light theme */
  .akl-page[data-landing-theme="light"],
  [data-landing-theme="light"] .akl-page {
    --akl-border: #c6c0b6;
    --akl-border-subtle: #d8d2c8;
    --akl-bg: #f7f4ee;
    --akl-surface: #eee8dd;
    --akl-text: #1a1a1a;
    --akl-text-muted: #55514b;
    --akl-text-subtle: #857f74;
    --akl-accent: #c95f3d;
    --akl-paper: #1a1a1a;
    --akl-paper-ink: #f7f4ee;
    --akl-page-color: #1a1a1a;
    --akl-header-bg: color-mix(in srgb, #f7f4ee 92%, transparent);
    --akl-mobile-nav-bg: color-mix(in srgb, #f7f4ee 96%, transparent);
    --akl-product-bg: #e8e2d6;
    --akl-window-bg: #e0d9cc;
    --akl-window-dot: #a99f91;
    --akl-window-label: #857f74;
    --akl-preview-bg: #e8e2d6;
    --akl-gallery-label-bg: color-mix(in srgb, #f7f4ee 85%, transparent);
    --akl-prompt-bg: #f2ede4;
    --akl-prompt-text: #403c36;
    --akl-hero-note-link: #6c665e;
    --akl-hero-note-border: #c6c0b6;
  }

  /* Fallback: when data-landing-theme is set on <html>, not .akl-page */
  [data-landing-theme="light"] {
    --akl-border: #c6c0b6;
    --akl-border-subtle: #d8d2c8;
    --akl-bg: #f7f4ee;
    --akl-surface: #eee8dd;
    --akl-text: #1a1a1a;
    --akl-text-muted: #55514b;
    --akl-text-subtle: #857f74;
    --akl-accent: #c95f3d;
    --akl-paper: #1a1a1a;
    --akl-paper-ink: #f7f4ee;
    --akl-page-color: #1a1a1a;
    --akl-header-bg: color-mix(in srgb, #f7f4ee 92%, transparent);
    --akl-mobile-nav-bg: color-mix(in srgb, #f7f4ee 96%, transparent);
    --akl-product-bg: #e8e2d6;
    --akl-window-bg: #e0d9cc;
    --akl-window-dot: #a99f91;
    --akl-window-label: #857f74;
    --akl-preview-bg: #e8e2d6;
    --akl-gallery-label-bg: color-mix(in srgb, #f7f4ee 85%, transparent);
    --akl-prompt-bg: #f2ede4;
    --akl-prompt-text: #403c36;
    --akl-hero-note-link: #6c665e;
    --akl-hero-note-border: #c6c0b6;
  }

  .akl-page a {
    color: inherit;
    text-decoration: none;
  }

  .akl-page section[id] {
    scroll-margin-top: var(--akl-anchor-offset);
  }

  .akl-shell {
    width: min(100%, 1180px);
    margin: 0 auto;
    padding-inline: 32px;
  }

  /* ─── Header ─────────────────────────────────────────── */

  .akl-site-header {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 50;
    background: var(--akl-header-bg);
    backdrop-filter: saturate(140%) blur(10px);
    -webkit-backdrop-filter: saturate(140%) blur(10px);
    border-bottom: 0.5px solid var(--akl-border-subtle);
  }

  .akl-header-row {
    min-height: 84px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .akl-brand {
    color: var(--akl-text);
    font-family: var(--app-font-serif);
    font-size: 28px;
    font-weight: 500;
    line-height: 1;
    transition: color 180ms ease;
  }

  .akl-brand:hover,
  .akl-brand:focus-visible {
    color: var(--akl-accent);
  }

  .akl-site-nav {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 24px;
    margin-left: auto;
  }

  .akl-header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: nowrap;
  }

  .akl-site-nav a {
    position: relative;
    color: var(--akl-text-muted);
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.22em;
    line-height: 1;
    text-transform: uppercase;
    white-space: nowrap;
    transition: color 180ms ease;
  }

  .akl-site-nav a::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: -8px;
    left: 0;
    height: 1.5px;
    background: var(--akl-accent);
    opacity: 0;
    transform: scaleX(0.42);
    transform-origin: center;
    transition:
      opacity 180ms ease,
      transform 180ms ease;
  }

  .akl-site-nav a:hover,
  .akl-site-nav a:focus-visible {
    color: var(--akl-accent);
  }

  .akl-site-nav a:hover::after,
  .akl-site-nav a:focus-visible::after {
    opacity: 0.45;
    transform: scaleX(1);
  }

  /* Language + theme toggles — quiet mono buttons */
  .akl-lang-toggle,
  .akl-theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    border: 0.5px solid var(--akl-border-subtle);
    border-radius: 2px;
    background: transparent;
    color: var(--akl-text-muted);
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: color 160ms ease, border-color 160ms ease;
  }

  .akl-lang-toggle:hover,
  .akl-lang-toggle:focus-visible,
  .akl-theme-toggle:hover,
  .akl-theme-toggle:focus-visible {
    color: var(--akl-accent);
    border-color: var(--akl-accent);
  }

  .akl-theme-toggle svg {
    display: none;
  }

  [data-landing-theme="dark"] .akl-theme-icon-dark {
    display: block;
  }

  [data-landing-theme="light"] .akl-theme-icon-light {
    display: block;
  }

  /* Subtle "Main site" return link */
  .akl-main-site-link {
    color: var(--akl-text-subtle);
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    white-space: nowrap;
    transition: color 180ms ease;
  }

  .akl-main-site-link:hover,
  .akl-main-site-link:focus-visible {
    color: var(--akl-accent);
  }

  /* Focus-visible — warm accent outline, never blue default. */
  .akl-site-nav a:focus-visible,
  .akl-main-site-link:focus-visible,
  .akl-brand:focus-visible,
  .akl-button:focus-visible,
  .akl-gallery-button:focus-visible,
  .akl-surface-tab:focus-visible,
  .akl-mobile-toggle:focus-visible,
  .akl-mobile-nav a:focus-visible,
  .akl-hero-github:focus-visible,
  .akl-get-started-link:focus-visible,
  .akl-faq summary:focus-visible,
  .akl-lang-toggle:focus-visible,
  .akl-theme-toggle:focus-visible {
    outline: 0.5px solid var(--akl-accent);
    outline-offset: 4px;
  }

  /* ─── Mobile menu ────────────────────────────────────── */

  .akl-mobile-menu {
    display: none;
  }

  .akl-mobile-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: var(--akl-text-muted);
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    line-height: 1;
    list-style: none;
    white-space: nowrap;
    transition: color 180ms ease;
  }

  .akl-mobile-toggle::-webkit-details-marker {
    display: none;
  }

  .akl-mobile-toggle i {
    position: relative;
    width: 1rem;
    height: 0.7rem;
  }

  .akl-mobile-toggle i::before,
  .akl-mobile-toggle i::after {
    content: "";
    position: absolute;
    left: 0;
    width: 100%;
    height: 1.5px;
    background: currentColor;
    transition:
      top 180ms ease,
      transform 180ms ease;
  }

  .akl-mobile-toggle i::before {
    top: 0.1rem;
  }

  .akl-mobile-toggle i::after {
    top: 0.48rem;
  }

  .akl-mobile-toggle:hover,
  .akl-mobile-toggle:focus-visible {
    color: var(--akl-accent);
  }

  .akl-mobile-menu[open] .akl-mobile-toggle i::before {
    top: 0.3rem;
    transform: rotate(45deg);
  }

  .akl-mobile-menu[open] .akl-mobile-toggle i::after {
    top: 0.3rem;
    transform: rotate(-45deg);
  }

  .akl-mobile-nav {
    position: absolute;
    top: 100%;
    right: 0;
    left: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
    padding: 8px 18px 20px;
    border-bottom: 0.5px solid var(--akl-border);
    background: var(--akl-mobile-nav-bg);
    backdrop-filter: saturate(140%) blur(10px);
    -webkit-backdrop-filter: saturate(140%) blur(10px);
  }

  .akl-mobile-nav a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 2.4rem;
    padding: 0.5rem 0;
    border-bottom: 0.5px solid var(--akl-border-subtle);
    color: var(--akl-text-muted);
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    transition: color 160ms ease;
  }

  .akl-mobile-nav a:hover,
  .akl-mobile-nav a:focus-visible {
    color: var(--akl-accent);
  }

  /* ─── Buttons ────────────────────────────────────────── */

  .akl-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    border-radius: 2px;
    padding: 0 18px;
    font-family: var(--app-font-sans);
    font-size: 15px;
    font-weight: 700;
    line-height: 1;
    transition:
      background 180ms ease,
      border-color 180ms ease,
      color 180ms ease;
  }

  .akl-page .akl-button-light {
    background: var(--akl-paper);
    color: var(--akl-paper-ink);
  }

  .akl-page .akl-button-light:hover,
  .akl-page .akl-button-light:focus-visible {
    background: color-mix(in srgb, var(--akl-paper) 85%, var(--akl-accent));
  }

  .akl-page .akl-button-dark {
    border: 0.5px solid var(--akl-border);
    background: var(--akl-surface);
    color: var(--akl-text);
  }

  .akl-page .akl-button-dark:hover,
  .akl-page .akl-button-dark:focus-visible {
    border-color: var(--akl-accent);
    color: var(--akl-accent);
  }

  /* ─── Hero ───────────────────────────────────────────── */

  .akl-hero {
    width: min(100%, 1080px);
    margin: 0 auto;
    padding: 88px 32px 64px;
    text-align: center;
  }

  .akl-hero-wordmark {
    margin: 0 0 14px;
    color: var(--akl-text-subtle);
    font-family: var(--app-font-mono);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.28em;
    text-transform: uppercase;
  }

  .akl-eyebrow {
    margin: 0;
    color: var(--akl-accent);
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .akl-hero h1,
  .akl-section h2,
  .akl-get-started-copy h2,
  .akl-faq h2 {
    margin: 0;
    color: var(--akl-text);
    font-family: var(--app-font-serif);
    font-weight: 500;
    letter-spacing: 0;
  }

  .akl-hero h1 {
    margin-top: 16px;
    font-size: 68px;
    line-height: 1.02;
  }

  .akl-hero h1::after {
    content: ".";
    color: var(--akl-accent);
  }

  .akl-hero-lede {
    max-width: 720px;
    margin: 26px auto 0;
    color: var(--akl-text-muted);
    font-size: 22px;
    line-height: 1.45;
  }

  .akl-hero-actions {
    margin-top: 32px;
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .akl-hero-copy-prompt {
    display: inline-flex;
    align-items: center;
    min-height: 42px;
    border: 0.5px solid color-mix(in srgb, var(--akl-accent) 45%, transparent);
    border-radius: 2px;
    background: transparent;
    color: var(--akl-text);
    padding: 0 18px;
    font-family: var(--app-font-mono);
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    white-space: nowrap;
    transition:
      color 180ms ease,
      border-color 180ms ease;
  }

  .akl-hero-copy-prompt:hover,
  .akl-hero-copy-prompt:focus-visible {
    color: var(--akl-accent);
    border-color: var(--akl-accent);
  }

  .akl-hero-chips {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    margin: 22px 0 0;
    padding: 0;
    list-style: none;
  }

  .akl-hero-chips li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border: 0.5px solid var(--akl-border-subtle);
    border-radius: 2px;
    color: var(--akl-text-subtle);
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    line-height: 1;
    white-space: nowrap;
  }

  .akl-hero-chips li::before {
    content: "";
    width: 0.3rem;
    height: 0.3rem;
    border-radius: 999px;
    background: var(--akl-accent);
    flex: 0 0 auto;
  }

  .akl-hero-note {
    margin: 18px 0 0;
    color: var(--akl-text-subtle);
    font-size: 14px;
    line-height: 1.7;
  }

  .akl-hero-note a {
    border-bottom: 0.5px solid var(--akl-hero-note-border);
    color: var(--akl-hero-note-link);
    transition:
      color 180ms ease,
      border-color 180ms ease;
  }

  .akl-hero-note a:hover,
  .akl-hero-note a:focus-visible {
    color: var(--akl-accent);
    border-bottom-color: var(--akl-accent);
  }

  .akl-hero-github {
    display: inline-block;
    margin-top: 4px;
    color: var(--akl-text-muted);
    font-family: var(--app-font-mono);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border-bottom: 0.5px solid var(--akl-border);
    padding-bottom: 1px;
  }

  .akl-hero-github:hover,
  .akl-hero-github:focus-visible {
    color: var(--akl-accent);
    border-bottom-color: var(--akl-accent);
  }

  /* ─── Product showcase ───────────────────────────────── */

  .akl-showcase {
    width: min(100%, 1420px);
    margin: 0 auto;
    padding: 20px 32px 112px;
  }

  .akl-product-frame {
    overflow: hidden;
    border: 0.5px solid var(--akl-border);
    border-radius: 2px;
    background: var(--akl-product-bg);
  }

  .akl-window-top {
    min-height: 36px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 18px;
    border-bottom: 0.5px solid var(--akl-border);
    background: var(--akl-window-bg);
  }

  .akl-window-top span {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: var(--akl-window-dot);
  }

  .akl-window-top b {
    margin-left: auto;
    color: var(--akl-window-label);
    font-family: var(--app-font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .akl-overlay-img {
    display: block;
    width: 100%;
    height: auto;
  }

  /* ─── Sections ───────────────────────────────────────── */

  .akl-section {
    width: min(100%, 1180px);
    margin: 0 auto;
    padding: 96px 32px;
  }

  .akl-split-section {
    display: grid;
    grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.1fr);
    gap: 72px;
    align-items: start;
  }

  .akl-section h2,
  .akl-get-started-copy h2,
  .akl-faq h2 {
    margin-top: 16px;
    font-size: 48px;
    line-height: 1.05;
  }

  .akl-feature-list {
    border-top: 0.5px solid var(--akl-border-subtle);
  }

  .akl-feature-list article {
    padding: 26px 0;
    border-bottom: 0.5px solid var(--akl-border-subtle);
  }

  .akl-feature-list h3,
  .akl-workflow-card h3 {
    margin: 0;
    color: var(--akl-text);
    font-family: var(--app-font-serif);
    font-size: 22px;
    font-weight: 600;
    line-height: 1.2;
  }

  .akl-feature-list p,
  .akl-workflow-card p,
  .akl-get-started-copy p,
  .akl-faq details p {
    margin: 10px 0 0;
    color: var(--akl-text-muted);
    font-size: 16px;
    line-height: 1.62;
  }

  /* ─── Surfaces tabs (ARIA tabs) ──────────────────────── */

  .akl-surface-tabs {
    padding-top: 96px;
  }

  .akl-surface-intro {
    max-width: 640px;
    margin: 18px 0 0;
    color: var(--akl-text-muted);
    font-size: 18px;
    line-height: 1.6;
  }

  .akl-surface-tablist {
    width: max-content;
    max-width: 100%;
    margin-top: 36px;
    display: flex;
    gap: 0;
    overflow-x: auto;
    border-bottom: 0.5px solid var(--akl-border-subtle);
  }

  .akl-surface-tab {
    position: relative;
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    padding: 0 22px;
    border: 0;
    background: transparent;
    color: var(--akl-text-muted);
    cursor: pointer;
    font-family: var(--app-font-sans);
    font-size: 15px;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    transition: color 160ms ease;
  }

  .akl-surface-tab::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    height: 1.5px;
    background: var(--akl-accent);
    opacity: 0;
    transform: scaleX(0.42);
    transform-origin: center;
    transition:
      opacity 180ms ease,
      transform 180ms ease;
  }

  .akl-surface-tab:hover {
    color: var(--akl-accent);
  }

  .akl-surface-tab[data-selected] {
    color: var(--akl-text);
  }

  .akl-surface-tab[data-selected]::after {
    opacity: 1;
    transform: scaleX(1);
  }

  .akl-surface-stage {
    margin-top: 44px;
  }

  .akl-surface-panel[hidden] {
    display: none;
  }

  .akl-surface-kind-wide {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.7fr);
    gap: 64px;
    align-items: start;
  }

  .akl-surface-kind-tall {
    display: grid;
    grid-template-columns: minmax(200px, 300px) minmax(0, 1fr);
    gap: 64px;
    align-items: start;
  }

  .akl-surface-kind-strip {
    display: grid;
    grid-template-columns: 1fr;
    gap: 32px;
    align-items: start;
  }

  .akl-surface-kind-gallery {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.7fr);
    gap: 64px;
    align-items: start;
  }

  .akl-surface-preview {
    overflow: hidden;
    border: 0.5px solid var(--akl-border);
    border-radius: 2px;
    background: var(--akl-preview-bg);
    aspect-ratio: var(--akl-surface-media-ratio);
  }

  .akl-surface-preview-gallery {
    overflow: visible;
    border: 0;
    background: transparent;
    aspect-ratio: auto;
  }

  .akl-surface-preview img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
  }

  .akl-surface-kind-wide .akl-surface-preview img {
    aspect-ratio: 16 / 9;
  }

  .akl-surface-kind-tall .akl-surface-preview img {
    aspect-ratio: 470 / 760;
  }

  .akl-surface-kind-tall .akl-surface-preview {
    max-width: 340px;
  }

  .akl-surface-kind-strip .akl-surface-preview img {
    aspect-ratio: 1856 / 180;
  }

  .akl-surface-gallery {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 22px;
  }

  .akl-gallery-stage {
    width: 100%;
    overflow: hidden;
    border: 0.5px solid var(--akl-border);
    border-radius: 2px;
    background: var(--akl-preview-bg);
  }

  .akl-gallery-viewport {
    position: relative;
    overflow: hidden;
    aspect-ratio: var(--akl-surface-media-ratio);
    background: transparent;
  }

  .akl-gallery-viewport:focus-visible {
    outline: 0.5px solid var(--akl-accent);
    outline-offset: 4px;
  }

  .akl-surface-gallery-item {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    transition: opacity 200ms ease;
    pointer-events: none;
  }

  .akl-surface-gallery-item[data-active] {
    opacity: 1;
    pointer-events: auto;
  }

  .akl-surface-gallery-item img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .akl-gallery-meta {
    margin: 0;
    padding: 18px 20px;
    border-top: 0.5px solid var(--akl-border-subtle);
    color: var(--akl-text-subtle);
    font-family: var(--app-font-mono);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.22em;
    line-height: 1;
    text-align: center;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .akl-gallery-controls {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 26px;
  }

  .akl-gallery-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    border: 0.5px solid var(--akl-border);
    border-radius: 2px;
    background: transparent;
    color: var(--akl-text-muted);
    cursor: pointer;
    transition:
      color 160ms ease,
      border-color 160ms ease;
  }

  .akl-gallery-button:hover,
  .akl-gallery-button:focus-visible {
    color: var(--akl-accent);
    border-color: var(--akl-accent);
  }

  .akl-gallery-button:focus-visible {
    outline: 0.5px solid var(--akl-accent);
    outline-offset: 2px;
  }

  .akl-gallery-button:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .akl-gallery-position {
    margin: 0;
    display: flex;
    align-items: baseline;
    min-width: 72px;
    justify-content: center;
    color: var(--akl-text-muted);
    font-family: var(--app-font-mono);
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.18em;
    line-height: 1;
  }

  .akl-gallery-caption {
    margin: -6px 0 0;
    color: var(--akl-text-subtle);
    font-family: var(--app-font-mono);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.18em;
    line-height: 1.6;
    text-align: center;
    text-transform: uppercase;
  }

  .akl-surface-copy h3 {
    margin: 14px 0 0;
    color: var(--akl-text);
    font-family: var(--app-font-serif);
    font-size: 30px;
    font-weight: 600;
    line-height: 1.1;
  }

  .akl-surface-copy p:not(.akl-eyebrow) {
    margin: 18px 0 0;
    color: var(--akl-text-muted);
    font-size: 18px;
    line-height: 1.6;
  }

  .akl-surface-copy ul {
    margin: 28px 0 0;
    padding: 0;
    list-style: none;
    border-top: 0.5px solid var(--akl-border-subtle);
  }

  .akl-surface-copy li {
    padding: 16px 0;
    border-bottom: 0.5px solid var(--akl-border-subtle);
    color: var(--akl-text-muted);
    font-size: 16px;
    line-height: 1.35;
  }

  .akl-surface-copy li::before {
    content: "";
    display: inline-block;
    width: 0.36rem;
    height: 0.36rem;
    margin-right: 12px;
    border-radius: 999px;
    background: var(--akl-accent);
    vertical-align: 0.08em;
  }

  /* ─── Workflow ───────────────────────────────────────── */

  .akl-workflow-grid {
    margin-top: 40px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-top: 0.5px solid var(--akl-border-subtle);
    border-left: 0.5px solid var(--akl-border-subtle);
  }

  .akl-workflow-card {
    min-height: 240px;
    padding: 24px;
    border-right: 0.5px solid var(--akl-border-subtle);
    border-bottom: 0.5px solid var(--akl-border-subtle);
  }

  .akl-workflow-card span {
    display: block;
    margin-bottom: 32px;
    color: var(--akl-accent);
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
  }

  /* ─── Agent section ──────────────────────────────────── */

  .akl-agent-lede {
    max-width: 640px;
    margin: 18px 0 0;
    color: var(--akl-text-muted);
    font-size: 18px;
    line-height: 1.6;
  }

  .akl-agent-flow {
    margin: 56px 0 0;
    padding: 0;
    list-style: none;
    border-top: 0.5px solid var(--akl-border-subtle);
  }

  .akl-agent-step {
    display: grid;
    grid-template-columns: 80px minmax(0, 1fr);
    gap: 32px;
    align-items: start;
    padding: 32px 0;
    border-bottom: 0.5px solid var(--akl-border-subtle);
  }

  .akl-agent-step-num {
    color: var(--akl-accent);
    font-family: var(--app-font-mono);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.12em;
    line-height: 1;
    padding-top: 6px;
  }

  .akl-agent-step-body h3 {
    margin: 0;
    color: var(--akl-text);
    font-family: var(--app-font-serif);
    font-size: 24px;
    font-weight: 600;
    line-height: 1.2;
  }

  .akl-agent-step-body p {
    margin: 10px 0 0;
    color: var(--akl-text-muted);
    font-size: 16px;
    line-height: 1.62;
  }

  .akl-agent-safety {
    margin: 48px 0 0;
    padding: 0;
    list-style: none;
    border-top: 0.5px solid var(--akl-border-subtle);
    border-bottom: 0.5px solid var(--akl-border-subtle);
  }

  .akl-agent-safety li {
    padding: 18px 0;
    border-bottom: 0.5px solid var(--akl-border-subtle);
    color: var(--akl-text-muted);
    font-size: 15px;
    line-height: 1.5;
  }

  .akl-agent-safety li:last-child {
    border-bottom: 0;
  }

  .akl-agent-safety li::before {
    content: "";
    display: inline-block;
    width: 0.36rem;
    height: 0.36rem;
    margin-right: 12px;
    border-radius: 999px;
    background: var(--akl-accent);
    vertical-align: 0.08em;
  }

  .akl-agent-providers {
    margin: 28px 0 0;
    color: var(--akl-text-subtle);
    font-family: var(--app-font-mono);
    font-size: 13px;
    line-height: 1.6;
  }

  /* ─── Get started (agent/human handoff) ──────────────── */

  .akl-get-started {
    display: grid;
    grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.1fr);
    gap: 72px;
    align-items: start;
  }

  .akl-handoff {
    border: 0.5px solid var(--akl-border);
    border-radius: 2px;
    background: var(--akl-surface);
    overflow: hidden;
  }

  .akl-handoff-segmented {
    display: flex;
    border-bottom: 0.5px solid var(--akl-border-subtle);
  }

  .akl-handoff-seg {
    flex: 1 1 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    border: 0;
    background: transparent;
    color: var(--akl-text-muted);
    font-family: var(--app-font-mono);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    transition: color 160ms ease;
    position: relative;
  }

  .akl-handoff-seg[data-selected] {
    color: var(--akl-text);
  }

  .akl-handoff-seg[data-selected]::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 1.5px;
    background: var(--akl-accent);
  }

  .akl-handoff-seg:hover,
  .akl-handoff-seg:focus-visible {
    color: var(--akl-accent);
  }

  .akl-handoff-seg:focus-visible {
    outline: 0.5px solid var(--akl-accent);
    outline-offset: -2px;
  }

  .akl-handoff-panel[hidden] {
    display: none;
  }

  .akl-handoff-panel {
    padding: 24px;
  }

  .akl-handoff-tasks {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
  }

  .akl-handoff-chip {
    display: inline-flex;
    align-items: center;
    padding: 7px 14px;
    border: 0.5px solid var(--akl-border);
    border-radius: 2px;
    background: transparent;
    color: var(--akl-text-muted);
    font-family: var(--app-font-sans);
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
    white-space: nowrap;
    transition:
      color 160ms ease,
      border-color 160ms ease;
  }

  .akl-handoff-chip[data-selected] {
    color: var(--akl-text);
    border-color: var(--akl-accent);
  }

  .akl-handoff-chip:hover,
  .akl-handoff-chip:focus-visible {
    color: var(--akl-accent);
    border-color: var(--akl-accent);
  }

  .akl-handoff-chip:focus-visible {
    outline: 0.5px solid var(--akl-accent);
    outline-offset: 2px;
  }

  .akl-handoff-prompt {
    position: relative;
  }

  .akl-handoff-prompt-text {
    margin: 0;
    padding: 16px;
    border: 0.5px solid var(--akl-border-subtle);
    border-radius: 2px;
    background: var(--akl-prompt-bg);
    color: var(--akl-prompt-text);
    font-family: var(--app-font-mono);
    font-size: 13px;
    line-height: 1.65;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-x: auto;
    max-height: 340px;
    overflow-y: auto;
  }

  .akl-handoff-copy {
    display: inline-flex;
    align-items: center;
    margin-top: 12px;
    padding: 8px 16px;
    border: 0.5px solid var(--akl-border);
    border-radius: 2px;
    background: var(--akl-paper);
    color: var(--akl-paper-ink);
    font-family: var(--app-font-sans);
    font-size: 13px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    white-space: nowrap;
    transition:
      background 160ms ease,
      border-color 160ms ease;
  }

  .akl-handoff-copy:hover,
  .akl-handoff-copy:focus-visible {
    background: color-mix(in srgb, var(--akl-paper) 85%, var(--akl-accent));
  }

  .akl-handoff-copy:focus-visible {
    outline: 0.5px solid var(--akl-accent);
    outline-offset: 2px;
  }

  .akl-handoff-copy[data-state="copied"] {
    background: transparent;
    color: var(--akl-accent);
    border-color: var(--akl-accent);
  }

  .akl-handoff-copy[data-state="failed"] {
    background: transparent;
    color: #e07070;
    border-color: #e07070;
    font-size: 12px;
  }

  .akl-handoff-checklist {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 0.5px solid var(--akl-border-subtle);
  }

  .akl-handoff-checklist li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 0.5px solid var(--akl-border-subtle);
  }

  .akl-handoff-checklist-label {
    color: var(--akl-text-muted);
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .akl-handoff-checklist-value {
    color: var(--akl-accent);
    font-family: var(--app-font-mono);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: color 160ms ease;
  }

  a.akl-handoff-checklist-value:hover,
  a.akl-handoff-checklist-value:focus-visible {
    color: var(--akl-text);
  }

  .akl-get-started-link {
    display: inline-block;
    margin-top: 18px;
    color: var(--akl-text-muted);
    font-family: var(--app-font-mono);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    border-bottom: 0.5px solid var(--akl-border);
    padding-bottom: 1px;
    transition:
      color 180ms ease,
      border-color 180ms ease;
  }

  .akl-get-started-link:hover,
  .akl-get-started-link:focus-visible {
    color: var(--akl-accent);
    border-bottom-color: var(--akl-accent);
  }

  /* ─── FAQ ────────────────────────────────────────────── */

  .akl-faq {
    width: min(100%, 760px);
    margin: 0 auto;
    padding: 88px 32px 112px;
    text-align: center;
  }

  .akl-faq-mark {
    margin: 0;
    color: var(--akl-text-muted);
    font-family: var(--app-font-serif);
    font-size: 56px;
    line-height: 1;
  }

  .akl-faq-list {
    margin-top: 52px;
    border-top: 0.5px solid var(--akl-border-subtle);
    text-align: left;
  }

  .akl-faq details {
    border-bottom: 0.5px solid var(--akl-border-subtle);
    padding: 22px 0;
  }

  .akl-faq summary {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    cursor: pointer;
    color: var(--akl-text);
    font-family: var(--app-font-serif);
    font-size: 20px;
    font-weight: 600;
    list-style: none;
  }

  .akl-faq summary::-webkit-details-marker {
    display: none;
  }

  .akl-faq-question {
    flex: 1 1 auto;
  }

  .akl-faq-indicator {
    flex: 0 0 auto;
    position: relative;
    width: 14px;
    height: 14px;
    margin-top: 4px;
  }

  .akl-faq-indicator::before,
  .akl-faq-indicator::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 12px;
    height: 1.5px;
    background: var(--akl-text-subtle);
    transform: translate(-50%, -50%);
    transition: transform 180ms ease, opacity 180ms ease;
  }

  .akl-faq-indicator::after {
    width: 1.5px;
    height: 12px;
  }

  .akl-faq details[open] .akl-faq-indicator::after {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(90deg);
  }

  .akl-faq summary:hover .akl-faq-indicator::before,
  .akl-faq summary:hover .akl-faq-indicator::after,
  .akl-faq summary:focus-visible .akl-faq-indicator::before,
  .akl-faq summary:focus-visible .akl-faq-indicator::after {
    background: var(--akl-accent);
  }

  /* ─── Footer ─────────────────────────────────────────── */

  .akl-site-footer {
    border-top: 0.5px solid var(--akl-border-subtle);
    color: var(--akl-text-subtle);
  }

  .akl-footer-row {
    min-height: 96px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .akl-footer-row p {
    margin: 0;
  }

  .akl-footer-row nav {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .akl-footer-row a:hover,
  .akl-footer-row a:focus-visible {
    color: var(--akl-accent);
  }

  /* ─── Reduced motion ─────────────────────────────────── */

  @media (prefers-reduced-motion: reduce) {
    .akl-page *,
    .akl-page *::before,
    .akl-page *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
    }
  }

  /* ─── Responsive ─────────────────────────────────────── */

  @media (max-width: 980px) {
    .akl-site-nav {
      display: none;
    }

    .akl-main-site-link {
      display: none;
    }

    .akl-mobile-menu {
      display: block;
    }

    .akl-hero h1 {
      font-size: 44px;
    }

    .akl-split-section,
    .akl-get-started {
      grid-template-columns: 1fr;
      gap: 36px;
    }

    .akl-agent-step {
      grid-template-columns: 64px minmax(0, 1fr);
      gap: 24px;
    }

    .akl-surface-kind-wide {
      grid-template-columns: 1fr;
      gap: 32px;
    }

    .akl-surface-kind-gallery {
      grid-template-columns: 1fr;
      gap: 32px;
    }

    .akl-surface-kind-tall {
      grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
      gap: 32px;
    }

    .akl-workflow-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .akl-page {
      --akl-fixed-header-height: 72px;
    }

    .akl-shell {
      padding-inline: 18px;
    }

    .akl-header-row {
      min-height: 72px;
      gap: 12px;
    }

    .akl-brand {
      font-size: 24px;
    }

    .akl-header-actions {
      gap: 8px;
    }

    .akl-hero {
      padding: 56px 18px 44px;
    }

    .akl-hero h1 {
      font-size: 32px;
      line-height: 1.12;
    }

    .akl-hero-lede {
      font-size: 17px;
    }

    .akl-showcase,
    .akl-section,
    .akl-faq {
      padding-inline: 18px;
    }

    .akl-surface-tablist {
      width: 100%;
    }

    .akl-surface-tab {
      min-height: 42px;
      padding: 0 16px;
      font-size: 14px;
    }

    .akl-surface-kind-tall {
      grid-template-columns: 1fr;
    }

    .akl-surface-kind-tall .akl-surface-preview {
      max-width: 240px;
    }

    .akl-gallery-button {
      width: 32px;
      height: 32px;
    }

    .akl-section h2,
    .akl-get-started-copy h2,
    .akl-faq h2 {
      font-size: 32px;
    }

    .akl-workflow-grid {
      grid-template-columns: 1fr;
    }

    .akl-agent-step {
      grid-template-columns: 56px minmax(0, 1fr);
      gap: 18px;
    }

    .akl-handoff-prompt-text {
      font-size: 12px;
    }

    .akl-handoff-checklist li {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .akl-footer-row {
      align-items: flex-start;
      flex-direction: column;
      justify-content: center;
      padding-block: 24px;
    }
  }
`;
