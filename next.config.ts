import type { NextConfig } from "next";

function mediaRemotePattern(): URL[] | undefined {
  if (process.env["MEDIA_STORAGE_ENABLED"] !== "true") {
    return undefined;
  }

  const value = process.env["MEDIA_PUBLIC_BASE_URL"];
  if (value === undefined || value.length === 0) {
    return undefined;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }
    url.pathname = `${url.pathname.replace(/\/$/, "")}/**`;
    url.search = "";
    url.hash = "";
    return [url];
  } catch {
    return undefined;
  }
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:"
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  }
];

const remotePatterns = mediaRemotePattern();

const nextConfig: NextConfig = {
  distDir: process.env["NEXT_DIST_DIR"] ?? ".next",
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85],
    ...(remotePatterns === undefined ? {} : { remotePatterns })
  },
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
