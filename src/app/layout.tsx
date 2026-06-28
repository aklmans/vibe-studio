import type { Metadata } from "next";
import { getAppAppearanceBootScript } from "../lib/design-tokens";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Vibe Coding Live — Editorial broadcast graphics for coding streams",
  description:
    "An editorial broadcast graphics workbench for coding livestreams. Design overlay, cover, poster, sidebar and bottom bar surfaces, connect OBS browser sources, export the full kit. Optional AI drafts the session config — you review and apply.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Vibe Coding Live — Editorial broadcast graphics for coding streams",
    description:
      "An editorial broadcast graphics workbench for coding livestreams. Design overlay, cover, poster, sidebar and bottom bar surfaces, connect OBS browser sources, export the full kit. Optional AI drafts the session config — you review and apply.",
    images: ["/opengraph.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibe Coding Live — Editorial broadcast graphics for coding streams",
    description:
      "An editorial broadcast graphics workbench for coding livestreams. Design overlay, cover, poster, sidebar and bottom bar surfaces, connect OBS browser sources, export the full kit. Optional AI drafts the session config — you review and apply.",
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
      </head>
      <body>{children}</body>
    </html>
  );
}
