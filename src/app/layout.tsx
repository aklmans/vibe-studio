import type { Metadata } from "next";
import { getAppAppearanceBootScript } from "../lib/design-tokens";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aklman.com"),
  title: "Vibe Studio",
  description: "Build and export broadcast-ready Vibe Studio livestream graphics.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Vibe Studio",
    description: "Build and export broadcast-ready Vibe Studio livestream graphics.",
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
