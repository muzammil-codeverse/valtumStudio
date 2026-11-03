import type { NextConfig } from "next";

function mediaRemotePattern(): URL[] | undefined {
  const patterns: URL[] = [];
  const cloud = process.env["CLOUDINARY_CLOUD_NAME"];
  if (cloud && /^[a-z0-9_-]+$/i.test(cloud)) {
    patterns.push(new URL(`https://res.cloudinary.com/${cloud}/image/upload/**`));
  }

  if (process.env["MEDIA_STORAGE_ENABLED"] === "true") {
    const value = process.env["MEDIA_PUBLIC_BASE_URL"];
    if (value) {
      try {
        const url = new URL(value);
        if (url.protocol === "http:" || url.protocol === "https:") {
          url.pathname = `${url.pathname.replace(/\/$/, "")}/**`;
          url.search = "";
          url.hash = "";
          patterns.push(url);
        }
      } catch {
        // Invalid configuration must not authorize any arbitrary image host.
      }
    }
  }
  return patterns.length ? patterns : undefined;
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self' data: https://cdn.fontshare.com",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src https://aegis-sentinel-tau.vercel.app https://booking-marketplace-web.vercel.app https://www.ktcouriers.com https://math-intellect.vercel.app https://personality-analysis-exploiter.vercel.app",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "media-src 'self' https://res.cloudinary.com",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://api.fontshare.com",
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
  async redirects() {
    return [
      { source: "/about", destination: "/studio", permanent: true },
      { source: "/process", destination: "/approach", permanent: true },
      { source: "/start-a-project", destination: "/contact", permanent: true },
      { source: "/cookie", destination: "/cookies", permanent: true },
      { source: "/journal", destination: "/blog", permanent: true }
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  }
};

export default nextConfig;
