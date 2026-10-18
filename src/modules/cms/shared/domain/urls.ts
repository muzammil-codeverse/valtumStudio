const SAFE_EXTERNAL_PROTOCOLS = new Set(["https:", "http:"]);
const SAFE_RICH_TEXT_PROTOCOLS = new Set(["https:", "http:", "mailto:"]);

export function validateCanonicalUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return SAFE_EXTERNAL_PROTOCOLS.has(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function validateSafeRichTextLink(value: string): boolean {
  try {
    return SAFE_RICH_TEXT_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function validateNavigationHref(
  type: "INTERNAL" | "EXTERNAL" | "GROUP" | "CTA",
  href?: string
): boolean {
  if (type === "GROUP") return href === undefined || href === "";
  if (!href) return false;
  if (type === "INTERNAL") return href.startsWith("/") && !href.startsWith("//");
  return validateCanonicalUrl(href) !== undefined;
}
