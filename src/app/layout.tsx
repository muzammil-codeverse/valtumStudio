import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { env } from "@/config/env/server";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: "/apple-touch-icon.png"
  },
  description: siteConfig.description,
  metadataBase: new URL(env.APP_BASE_URL),
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
