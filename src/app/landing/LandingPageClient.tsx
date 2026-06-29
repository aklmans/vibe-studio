"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "../../lib/i18n";
import LandingProvider, { useLanding } from "./LandingProvider";
import GetStartedHandoff from "./GetStartedHandoff";
import SurfacesTabs from "./SurfacesTabs";
import {
  GITHUB_PROFILE_URL,
  GITHUB_URL,
  imageSrcForTheme,
  MAIN_SITE_URL,
  RSS_URL,
  X_URL,
} from "./content";

interface LandingPageClientProps {
  initialLocale: Locale;
}

export default function LandingPageClient({ initialLocale }: LandingPageClientProps) {
  return (
    <LandingProvider initialLocale={initialLocale}>
      {(value) => (
        <main data-testid="landing-page" className="akl-page" data-landing-theme={value.theme}>
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
          <a className="akl-brand" href="/" aria-label={c.brand}>
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
            <a
              href={MAIN_SITE_URL}
              className="akl-main-site-link"
              data-testid="landing-main-site-link"
            >
              {c.mainSiteLabel}
            </a>
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
              aria-pressed={theme === "light"}
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
        </div>
        <div className="akl-hero-utility">
          <button
            type="button"
            className="akl-hero-copy-prompt"
            data-testid="landing-hero-copy-prompt"
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
          galleryCarouselLabel={c.galleryCarouselLabel}
          galleryControlsLabel={c.galleryControlsLabel}
          galleryPrevLabel={c.galleryPrevLabel}
          galleryNextLabel={c.galleryNextLabel}
        />
      </section>

      <section id="agent" className="akl-section akl-agent" aria-label={c.agentEyebrow}>
        <p className="akl-eyebrow">{c.agentEyebrow}</p>
        <h2>{c.agentTitle}</h2>
        <p className="akl-agent-lede">{c.agentLede}</p>
        <p className="akl-agent-skill-note" data-testid="landing-agent-skill-note">
          <a href="/skill.md">{c.agentSkillNote}</a>
        </p>

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
