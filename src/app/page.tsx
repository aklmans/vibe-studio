import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Locale } from "../lib/i18n";
import { isShowcase } from "../lib/site-mode";
import { LANDING_LOCALE_KEY } from "./landing/content";
import LandingPageClient from "./landing/LandingPageClient";
import "./landing/styles/landing.css";

// "/" is deployment-mode gated (VIBE_SHOWCASE); keep it dynamic so the flag
// takes effect at request time (no rebuild to flip modes) rather than being
// baked into a static redirect at build. The landing already reads the locale
// cookie, so this adds no cost. See src/lib/site-mode.ts.
export const dynamic = "force-dynamic";

export default async function RootPage() {
  // The marketing landing owns "/" only on the public showcase deploy
  // (VIBE_SHOWCASE=1). A self-hosted / forked app instance sends "/" straight
  // to the studio, so self-hosters never pass through the owner-branded promo
  // page. See src/lib/site-mode.ts.
  if (!isShowcase()) {
    redirect("/studio");
  }
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LANDING_LOCALE_KEY);
  const initialLocale: Locale =
    localeCookie?.value === "zh" ? "zh" : "en";
  return <LandingPageClient initialLocale={initialLocale} />;
}
