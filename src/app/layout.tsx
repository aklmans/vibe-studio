import type { Metadata } from "next";
import { getAppAppearanceBootScript } from "../lib/design-tokens";
import { LANDING_LOCALE_KEY, LANDING_THEME_KEY } from "./landing/content";
import "./globals.css";

const DEFAULT_SITE_URL = "https://vibe-studio.aklman.com";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

/**
 * Boot script for the landing page theme and locale. Reads
 * `vibe-landing-theme` and `vibe-landing-locale` from localStorage and sets
 * `data-landing-theme` + `data-landing-locale` on <html> before hydration to
 * prevent theme/locale flash. This is separate from the Studio's
 * `data-appearance` system (which uses `vibe-overlay-state`). The attributes
 * coexist on <html>; landing CSS only responds to `data-landing-theme`,
 * Studio CSS only responds to `data-appearance`.
 *
 * The locale boot script also sets <html lang> so screen readers and search
 * engines see the correct language immediately. The server component
 * (page.tsx) reads the `vibe-landing-locale` cookie for SSR so the React tree
 * is rendered in the correct locale from the start — no English flash for zh
 * users. LandingProvider initialises locale from that server-provided prop,
 * then reconciles the boot-script-set attribute in an effect for the rare
 * case where cookie and localStorage disagree.
 */
function getLandingBootScript(): string {
  const themeKey = JSON.stringify(LANDING_THEME_KEY);
  const localeKey = JSON.stringify(LANDING_LOCALE_KEY);
  return `(function(){
  try {
    var t = localStorage.getItem(${themeKey});
    var theme = (t === "light" || t === "dark") ? t : "dark";
    document.documentElement.setAttribute("data-landing-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-landing-theme", "dark");
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
  title: "Vibe Studio — AI-prepared broadcast graphics for coding livestreams",
  description:
    "AI-prepared broadcast graphics for a coding livestream studio. Draft, review and apply session config, connect OBS browser sources, and export overlay, cover, poster and wallpaper assets.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Vibe Studio — AI-prepared broadcast graphics for coding livestreams",
    description:
      "AI-prepared broadcast graphics for a coding livestream studio. Draft, review and apply session config, connect OBS browser sources, and export overlay, cover, poster and wallpaper assets.",
    images: ["/opengraph.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibe Studio — AI-prepared broadcast graphics for coding livestreams",
    description:
      "AI-prepared broadcast graphics for a coding livestream studio. Draft, review and apply session config, connect OBS browser sources, and export overlay, cover, poster and wallpaper assets.",
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
