import { SEO_SOCIAL_IMAGE } from "@/modules/public-site/studio/seo";

export const runtime = "edge";
export const alt = "Valtum Studio homepage. Good ideas. Beautifully built.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Keep the previous first-party OG image URL usable by social caches.
 * The source is an authentic hero capture stored in Valtum's existing Cloudinary.
 */
export default async function OpenGraphImage(): Promise<Response> {
  const image = await fetch(SEO_SOCIAL_IMAGE, { cache: "force-cache" });
  if (!image.ok) {
    return new Response("Social image unavailable", { status: 502 });
  }
  return new Response(image.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400"
    }
  });
}
