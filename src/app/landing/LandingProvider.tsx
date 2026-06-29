"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Locale } from "../../lib/i18n";
import {
  getLandingContent,
  LANDING_LOCALE_KEY,
  LANDING_THEME_KEY,
  type LandingContent,
  type LandingTheme,
} from "./content";

interface LandingContextValue {
  locale: Locale;
  theme: LandingTheme;
  content: LandingContent;
  toggleLocale: () => void;
  toggleTheme: () => void;
}

const LandingContext = createContext<LandingContextValue | null>(null);

export function useLanding(): LandingContextValue {
  const ctx = useContext(LandingContext);
  if (!ctx) throw new Error("useLanding must be used within LandingProvider");
  return ctx;
}

interface LandingProviderProps {
  initialLocale: Locale;
  children: (value: LandingContextValue) => React.ReactNode;
}

/**
 * Manages landing page locale (zh/en) and theme (dark/light) state.
 *
 * Locale is initialised from a server-read cookie (via page.tsx) so that the
 * SSR HTML matches the user's preferred language — no English flash for zh
 * users on refresh. After hydration, the boot-script-set `data-landing-locale`
 * attribute (from localStorage) is checked as a fallback for the rare case
 * where cookie and localStorage disagree. When the user toggles locale, both
 * localStorage and a cookie are written so the next SSR render is correct.
 *
 * Theme is initialised from the default "dark" and reconciled with the
 * boot-script-set `data-landing-theme` attribute in an effect. Theme does not
 * need a cookie because CSS variables are applied by the browser immediately
 * from the `<html data-landing-theme>` attribute set before hydration — there
 * is no visual flash for theme.
 *
 * Persistence keys are deliberately separate from the Studio's
 * `vibe-overlay-state` key so landing preferences never leak into OverlayState.
 */
export default function LandingProvider({ children, initialLocale }: LandingProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [theme, setTheme] = useState<LandingTheme>("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const themeAttr = root.getAttribute("data-landing-theme");
    if (themeAttr === "dark" || themeAttr === "light") setTheme(themeAttr);

    // Check if localStorage locale (via boot script) differs from the cookie
    // value used for SSR. In the normal case they agree and no update fires.
    const localeAttr = root.getAttribute("data-landing-locale");
    if ((localeAttr === "zh" || localeAttr === "en") && localeAttr !== initialLocale) {
      setLocale(localeAttr);
    }

    setHydrated(true);
  }, [initialLocale]);

  // Sync theme to <html data-landing-theme> + persist.
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.setAttribute("data-landing-theme", theme);
    try {
      localStorage.setItem(LANDING_THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme, hydrated]);

  // Sync locale to <html lang> + <html data-landing-locale> + localStorage + cookie.
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.setAttribute("data-landing-locale", locale);
    root.setAttribute("lang", locale === "zh" ? "zh-CN" : "en");
    try {
      localStorage.setItem(LANDING_LOCALE_KEY, locale);
    } catch {
      // ignore
    }
    // Write a cookie so the server component (page.tsx) can read the locale
    // on the next request and render the correct language in SSR HTML.
    document.cookie = `${LANDING_LOCALE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [locale, hydrated]);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => (prev === "en" ? "zh" : "en"));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const content = getLandingContent(locale);

  const value: LandingContextValue = {
    locale,
    theme,
    content,
    toggleLocale,
    toggleTheme,
  };

  return <LandingContext.Provider value={value}>{children(value)}</LandingContext.Provider>;
}
