export function isSafeNavigationHref(
  href: string | null,
  type: "INTERNAL" | "EXTERNAL" | "GROUP" | "CTA"
): boolean {
  if (type === "GROUP") {
    return href === null || href === "";
  }
  if (!href) {
    return false;
  }

  const trimmed = href.trim();

  // Prevent traversal and protocol-relative links
  if (
    trimmed.includes("..") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("\\\\")
  ) {
    return false;
  }

  if (type === "INTERNAL" || type === "CTA") {
    // Must begin with a single slash
    if (!trimmed.startsWith("/")) {
      return false;
    }
    // Block admin, auth, preview, and API paths
    if (
      trimmed.startsWith("/admin") ||
      trimmed.startsWith("/auth") ||
      trimmed.startsWith("/api") ||
      trimmed.startsWith("/preview")
    ) {
      return false;
    }
    return true;
  }

  // External URLs
  try {
    const url = new URL(trimmed);
    const allowed = ["https:", "mailto:", "tel:"];
    return allowed.includes(url.protocol);
  } catch {
    return false;
  }
}
