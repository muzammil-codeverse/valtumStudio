import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { getTrustedBaseUrl } from "@/modules/public-content/domain/routes";

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: "/apple-touch-icon.png"
  },
  description: siteConfig.description,
  metadataBase: new URL(getTrustedBaseUrl() ?? "https://valtum-studio.vercel.app"),
  title: siteConfig.title
};

export default function FrontendLayout({
  children
}: Readonly<{ children: ReactNode }>): React.JSX.Element {
  return (
    <html lang={siteConfig.htmlLanguage}>
      <body>{children}</body>
    </html>
  );
}
