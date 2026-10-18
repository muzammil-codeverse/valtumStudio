import { validateSlug } from "@/modules/cms/shared/domain/slug";

/**
 * Pure route-building module following approved public information architecture.
 */
export const publicRoutes = {
  home: () => "/",
  services: () => "/services",
  service: (slug: string) => buildSafePath("/services", slug),
  work: () => "/work",
  project: (slug: string) => buildSafePath("/work", slug),
  process: () => "/process",
  about: () => "/about",
  insights: () => "/insights",
  insight: (slug: string) => buildSafePath("/insights", slug),
  faq: () => "/faq",
  contact: () => "/contact",
  privacy: () => "/privacy",
  terms: () => "/terms",
  accessibility: () => "/accessibility"
} as const;

/**
 * Safe path builder to prevent path traversal and arbitrary path injection.
 */
function buildSafePath(prefix: string, slug: string): string {
  if (slug.includes("..") || slug.includes("/") || slug.includes("\\")) {
    throw new Error("Traversal path rejected");
  }
  const validation = validateSlug(slug);
  if (!validation.ok) {
    throw new Error(`Invalid slug for route path: ${slug}`);
  }
  // URL encode segment to be absolutely safe
  const encoded = encodeURIComponent(validation.slug);
  return `${prefix}/${encoded}`;
}

/**
 * Generates an absolute canonical URL from a trusted base URL.
 * Preserves subpaths in the base URL and cleans trailing slashes.
 */
export function generateCanonicalUrl(path: string, appBaseUrl: string): string {
  if (!appBaseUrl) {
    throw new Error("APP_BASE_URL must be configured.");
  }

  // Parse through URL class to guarantee trusted structure
  const base = new URL(appBaseUrl);

  // Strip query params and hash fragments
  const noQuery = path.split("?")[0] ?? "";
  const pathClean = (noQuery.split("#")[0] ?? "").replace(/^\/+/, "");

  // Clean base path and strip trailing slashes
  const basePath = base.pathname.replace(/^\/+/, "").replace(/\/+$/, "");

  let fullPath = "";
  if (basePath.length > 0 && pathClean.length > 0) {
    fullPath = `/${basePath}/${pathClean}`;
  } else if (basePath.length > 0) {
    fullPath = `/${basePath}`;
  } else if (pathClean.length > 0) {
    fullPath = `/${pathClean}`;
  } else {
    fullPath = "/";
  }

  // Build the final string utilizing base origin only (prevents override)
  const result = `${base.origin}${fullPath}`;

  // Clean multiple slashes except double slash in protocol
  const normalized = result.replace(/([^:]\/)\/+/g, "$1");

  // Strip trailing slash unless it's just the root domain or subpath root
  if (normalized.endsWith("/") && normalized.split("/").length > 3) {
    return normalized.replace(/\/+$/, "");
  }

  return normalized;
}

/**
 * Validates and retrieves the trusted application base URL.
 * Permitted only http: and https: protocols.
 * Strips credentials, query, and hash.
 * Normalizes trailing slashes.
 * Rejects localhost and loopback hosts in production.
 * Permits localhost fallback outside production.
 */
export function getTrustedBaseUrl(): string | null {
  const envBaseUrl = process.env["APP_BASE_URL"];
  const appEnv = process.env["APP_ENV"] || "local";
  const isProd = appEnv === "production";

  let urlToParse = envBaseUrl;
  if (!urlToParse) {
    if (isProd) {
      return null;
    }
    urlToParse = "http://localhost:3000/";
  }

  try {
    const url = new URL(urlToParse);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    const host = url.hostname.toLowerCase();
    const isLocalhost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.startsWith("127.");

    if (isProd && isLocalhost) {
      return null;
    }

    let pathname = url.pathname;
    if (!pathname.endsWith("/")) {
      pathname += "/";
    }
    pathname = pathname.replace(/\/+/g, "/");

    return `${url.protocol}//${url.host}${pathname}`;
  } catch {
    if (!isProd) {
      return "http://localhost:3000/";
    }
    return null;
  }
}
