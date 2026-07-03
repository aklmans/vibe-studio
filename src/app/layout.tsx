import type { Metadata } from "next";
import { getAppAppearanceBootScript } from "../lib/design-tokens";
import { LANDING_LOCALE_KEY, LANDING_THEME_KEY } from "./landing/content";
import "./globals.css";

const DEFAULT_SITE_URL = "https://vibe-studio.aklman.com";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

/**
 * Root layout for all routes (/, /demo, /studio, /obs/*, /api/*).
 *
 * Locale / <html lang> boundary:
 * - The landing route (/) is dynamic and reads `vibe-landing-locale` from
 *   cookies in page.tsx so SSR renders the correct language — no English
 *   flash for zh users.
 * - This root layout is shared by ALL routes and must NOT call cookies()
 *   or headers(). Doing so would make /demo, /studio, /obs/*, and /api/*
 *   request-dynamic, breaking static prerendering and CDN caching.
 * - Therefore <html lang="en"> is hardcoded in SSR. The boot script
 *   (getLandingBootScript) corrects <html lang> + data-landing-locale from
 *   localStorage before hydration. This means:
 *   • Users with JS: see correct <html lang> immediately after boot script.
 *   • Crawlers without JS: see lang="en" — acceptable because the landing
 *     page's <meta> description and OG tags are in English, and /demo and
 *     /studio render the Studio builder which has its own locale system.
 * - If future work needs SSR-correct <html lang> for all routes, consider
 *   middleware-based locale detection that sets a cookie and rewrites, but
 *   do NOT add cookies()/headers() to this layout.
 */
function getLandingBootScript(): string {
  const themeKey = JSON.stringify(LANDING_THEME_KEY);
  const localeKey = JSON.stringify(LANDING_LOCALE_KEY);
  return `(function(){
  try {
    var t = localStorage.getItem(${themeKey});
    var theme = (t === "light" || t === "dark") ? t : "light";
    document.documentElement.setAttribute("data-landing-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-landing-theme", "light");
  }
  try {
    var l = localStorage.getItem(${localeKey});
    var locale = (l === "zh" || l === "en") ? l : "en";
    document.documentElement.setAttribute("data-landing-locale", locale);
    document.documentElement.setAttribute("lang", locale === "zh" ? "zh-CN" : "en");
  } catch (e) {
    document.documentElement.setAttribute("data-landing-locale", "en");
  }
})();`;
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Vibe Studio — Designed live graphics without fighting OBS",
  description:
    "Designed live graphics for Study With Me, Coding With Me, Build in Public, gaming, chat and co-working streams. Agent drafts session copy and config, you review and apply, and OBS stays flexible underneath.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Vibe Studio — Designed live graphics without fighting OBS",
    description:
      "Designed live graphics for Study With Me, Coding With Me, Build in Public, gaming, chat and co-working streams. Agent drafts session copy and config, you review and apply, and OBS stays flexible underneath.",
    siteName: "Vibe Studio",
    images: ["/opengraph.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibe Studio — Designed live graphics without fighting OBS",
    description:
      "Designed live graphics for Study With Me, Coding With Me, Build in Public, gaming, chat and co-working streams. Agent drafts session copy and config, you review and apply, and OBS stays flexible underneath.",
    images: ["/opengraph.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: getAppAppearanceBootScript() }}
        />
        <script
          dangerouslySetInnerHTML={{ __html: getLandingBootScript() }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
