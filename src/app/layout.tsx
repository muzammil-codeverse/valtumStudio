import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { SEO_ORIGIN, SEO_SOCIAL_IMAGE } from "@/modules/public-site/studio/seo";

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: "/apple-touch-icon.png"
  },
  description: siteConfig.description,
  metadataBase: new URL(SEO_ORIGIN),
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Valtum Studio",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [{ url: SEO_SOCIAL_IMAGE, width: 1200, height: 630, alt: "Valtum Studio" }]
  },
  twitter: { card: "summary_large_image", images: [SEO_SOCIAL_IMAGE] },
  title: siteConfig.title
};

type RootLayoutProperties = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProperties): ReactNode {
  return (
    <html lang={siteConfig.htmlLanguage}>
      <body>{children}</body>
    </html>
  );
}
