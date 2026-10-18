export type RedirectRule = Readonly<{
  sourcePath: string;
  destinationPath: string;
  permanent: boolean;
}>;

// Static registry of legacy path redirects
export const staticRedirectRegistry: ReadonlyArray<RedirectRule> = [
  { sourcePath: "/services-old", destinationPath: "/services", permanent: true },
  { sourcePath: "/projects-old", destinationPath: "/work", permanent: true },
  { sourcePath: "/insights-old", destinationPath: "/insights", permanent: true },
  { sourcePath: "/faq-old", destinationPath: "/faq", permanent: false }
];

/**
 * Normalizes redirect paths by removing trailing slashes, decoding URI, and trimming.
 */
export function normalizePath(path: string): string {
  const noQuery = path.trim().split("?")[0] ?? "";
  let cleaned = noQuery.split("#")[0] ?? "";
  if (cleaned.length > 1 && cleaned.endsWith("/")) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned.toLowerCase();
}

/**
 * Validates a candidate redirect path at three stages:
 * 1. raw input
 * 2. bounded decoded input
 * 3. normalized URL pathname
 */
export function isSafeRedirectPath(path: string): boolean {
  if (typeof path !== "string" || path.trim() === "") {
    return false;
  }

  const raw = path.trim();

  // Stage 1: Raw input checks
  // Must start with exactly one "/"
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return false;
  }

  // Reject raw backslashes
  if (raw.includes("\\")) {
    return false;
  }

  // Reject control characters (0-31, 127)
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if (code <= 31 || code === 127) {
      return false;
    }
  }

  // Reject common encoded/raw traversal patterns case-insensitively
  const lowerRaw = raw.toLowerCase();
  const blacklistedSubstrings = [
    "..",
    ".%2e",
    "%2e.",
    "%2e%2e",
    "%252e%252e",
    "%2f",
    "%5c",
    "%252f",
    "%255c"
  ];
  for (const sub of blacklistedSubstrings) {
    if (lowerRaw.includes(sub)) {
      return false;
    }
  }

  // Stage 2: Bounded decoded input checks
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
    // Double decoding pass for nested encodings
    decoded = decodeURIComponent(decoded);
  } catch {
    return false;
  }

  // Reject traversal or backslashes in decoded content
  if (decoded.includes("..") || decoded.includes("\\")) {
    return false;
  }

  // Reject control characters in decoded content
  for (let i = 0; i < decoded.length; i++) {
    const code = decoded.charCodeAt(i);
    if (code <= 31 || code === 127) {
      return false;
    }
  }

  // Reject absolute URLs, protocol-relative URLs, or credentials/host overrides
  if (/^(https?:|javascript:|mailto:|tel:|ftp:)/i.test(decoded)) {
    return false;
  }
  // Reject double slashes anywhere in decoded input
  if (decoded.includes("//")) {
    return false;
  }

  // Stage 3: Normalized URL pathname checks
  try {
    const url = new URL(raw, "http://localhost");
    // Ensure the host is still localhost and protocol is http:
    if (url.host !== "localhost" || url.protocol !== "http:") {
      return false;
    }

    const pathname = url.pathname;
    const lowerPathname = pathname.toLowerCase();

    // Check for traversal in normalized path
    if (lowerPathname.includes("..") || pathname.includes("\\")) {
      return false;
    }

    // Reject destinations under /admin, /api, /auth, /preview
    const rejectedPrefixes = ["/admin", "/api", "/auth", "/preview"];
    for (const prefix of rejectedPrefixes) {
      if (lowerPathname === prefix || lowerPathname.startsWith(prefix + "/")) {
        return false;
      }
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Validates a single redirect entry for security and correctness.
 */
export function validateRedirectEntry(
  rule: RedirectRule
): { ok: true } | { ok: false; reason: string } {
  const src = rule.sourcePath.trim();
  const dest = rule.destinationPath.trim();

  if (!isSafeRedirectPath(src)) {
    return { ok: false, reason: "Source path is unsafe or invalid." };
  }
  if (!isSafeRedirectPath(dest)) {
    return { ok: false, reason: "Destination path is unsafe or invalid." };
  }

  const normSrc = normalizePath(src);
  const normDest = normalizePath(dest);

  if (normSrc === normDest) {
    return { ok: false, reason: "Source and destination cannot be identical." };
  }

  return { ok: true };
}

/**
 * Resolves a source path through the redirect registry.
 * Enforces loop detection and chain prevention:
 * - If a loop is found, it throws or returns null.
 * - If a chain is found, it throws or returns null (to enforce no chain configuration).
 */
export function resolveRedirect(
  path: string,
  registry: ReadonlyArray<RedirectRule> = staticRedirectRegistry
): { destinationPath: string; permanent: boolean } | null {
  const normPath = normalizePath(path);

  // Find first matching rule
  const matched = registry.find((r) => normalizePath(r.sourcePath) === normPath);
  if (!matched) {
    return null;
  }

  // Run validation checks on matching rule
  const validation = validateRedirectEntry(matched);
  if (!validation.ok) {
    return null;
  }

  // Loop & Chain detection
  let currentDest = matched.destinationPath;
  let permanent = matched.permanent;
  const visited = new Set<string>([normPath]);
  let hops = 0;

  while (true) {
    const nextNorm = normalizePath(currentDest);

    // Loop detected
    if (visited.has(nextNorm)) {
      return null;
    }
    visited.add(nextNorm);

    const nextMatched = registry.find((r) => normalizePath(r.sourcePath) === nextNorm);
    if (!nextMatched) {
      break;
    }

    hops++;
    // Chain detected (we prevent redirect chains)
    if (hops > 0) {
      return null;
    }

    currentDest = nextMatched.destinationPath;
    if (!nextMatched.permanent) {
      permanent = false; // downgrade to temporary if any chain element is temporary
    }
  }

  return {
    destinationPath: currentDest,
    permanent
  };
}
