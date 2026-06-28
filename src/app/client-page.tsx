"use client";

import dynamic from "next/dynamic";
import { LocaleProvider } from "../hooks/useLocale";

const OverlayBuilderApp = dynamic(
  () => import("../components/OverlayBuilderApp"),
  {
    ssr: false,
  },
);

export interface ClientPageProps {
  /** Public demo mode: the builder runs locally without AI/DB/OBS side effects. */
  demoMode?: boolean;
}

export default function ClientPage({ demoMode = false }: ClientPageProps) {
  return (
    <LocaleProvider>
      <OverlayBuilderApp demoMode={demoMode} />
    </LocaleProvider>
  );
}
