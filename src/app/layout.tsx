import type { Metadata } from "next";
import { getAppAppearanceBootScript } from "../lib/design-tokens";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Vibe Coding Live",
  description: "Editorial live graphics for coding streams.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Vibe Coding Live",
    description: "Editorial live graphics for coding streams.",
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
