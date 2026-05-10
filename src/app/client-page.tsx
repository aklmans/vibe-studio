"use client";

import dynamic from "next/dynamic";
import { LocaleProvider } from "../hooks/useLocale";

const OverlayBuilderApp = dynamic(
  () => import("../components/OverlayBuilderApp"),
  {
    ssr: false,
  },
);

export default function ClientPage() {
  return (
    <LocaleProvider>
      <OverlayBuilderApp />
    </LocaleProvider>
  );
}
