"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Locale } from "../../lib/i18n";
import {
  DEFAULT_LOCALE,
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
  children: (value: LandingContextValue) => React.ReactNode;
}

/**
 * Manages landing page locale (zh/en) and theme (dark/light) state.
 *
 * Persistence:
 * - `vibe-landing-locale` in localStorage — "zh" or "en"
 * - `vibe-landing-theme` in localStorage — "dark" or "light"
 *
 * These keys are deliberately separate from the Studio's `vibe-overlay-state`
 * key. Landing preferences never leak into OverlayState, and Studio settings
 * never affect the landing page. If the user switches theme in the Studio, the
 * landing page keeps its own preference.
 *
 * Theme is applied via `data-landing-theme` on `<html>`. Locale is applied via
 * `data-landing-locale` + `<html lang>`. A boot script in layout.tsx sets
 * both before hydration to prevent flash. The provider reads them as lazy
 * useState initializers (no English-flash on refresh), then keeps them in sync.
 */
export default function LandingProvider({ children }: LandingProviderProps) {
  // Read boot-script-set attributes as initial state — prevents locale/theme
  // flash on refresh. The boot script in layout.tsx runs before hydration and
  // sets data-landing-locale / data-landing-theme from localStorage.
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof document !== "undefined") {
      const attr = document.documentElement.getAttribute("data-landing-locale");
      if (attr === "zh" || attr === "en") return attr;
    }
    return DEFAULT_LOCALE;
  });
  const [theme, setTheme] = useState<LandingTheme>(() => {
    if (typeof document !== "undefined") {
      const attr = document.documentElement.getAttribute("data-landing-theme");
      if (attr === "dark" || attr === "light") return attr;
    }
    return "dark";
  });

  // Sync theme to <html data-landing-theme> + persist.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-landing-theme", theme);
    try {
      localStorage.setItem(LANDING_THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Sync locale to <html lang> + <html data-landing-locale> + persist.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-landing-locale", locale);
    root.setAttribute("lang", locale === "zh" ? "zh-CN" : "en");
    try {
      localStorage.setItem(LANDING_LOCALE_KEY, locale);
    } catch {
      // ignore
    }
  }, [locale]);

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
