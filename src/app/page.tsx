import { cookies } from "next/headers";
import type { Locale } from "../lib/i18n";
import { LANDING_LOCALE_KEY } from "./landing/content";
import LandingPageClient from "./landing/LandingPageClient";
import "./landing/styles/landing.css";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LANDING_LOCALE_KEY);
  const initialLocale: Locale =
    localeCookie?.value === "zh" ? "zh" : "en";
  return <LandingPageClient initialLocale={initialLocale} />;
}
