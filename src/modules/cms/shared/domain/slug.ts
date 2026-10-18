export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "preview",
  "login",
  "logout",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico"
]);

export type SlugResult =
  Readonly<{ ok: true; slug: string }> | Readonly<{ ok: false; message: string }>;

export function normalizeSlug(value: string, maxLength = 120): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

export function validateSlug(value: string, maxLength = 120): SlugResult {
  const slug = normalizeSlug(value, maxLength);
  if (!slug)
    return { ok: false, message: "Enter a slug containing letters or numbers." };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, message: "This slug is reserved." };
  return { ok: true, slug };
}
