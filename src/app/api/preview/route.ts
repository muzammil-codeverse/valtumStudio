import { draftMode } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { validateSlug } from "@/modules/cms/shared/domain/slug";
import {
  authorizePreview,
  getPreviewRedirectPath,
  type PreviewType
} from "@/modules/public-content/server/preview";

/**
 * Endpoint: GET /api/preview?type=<type>&slug=<slug>
 * Enables Next.js Draft Mode and redirects to the canonical detail path.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");
  const slugParam = searchParams.get("slug");

  if (!typeParam || !slugParam) {
    return new Response("Missing type or slug parameters.", { status: 400 });
  }

  const validTypes = ["service", "project", "insight"];
  if (!validTypes.includes(typeParam)) {
    return new Response("Invalid content type for preview.", { status: 400 });
  }

  const type = typeParam as PreviewType;
  const slug = slugParam.trim();

  const validation = validateSlug(slug);
  if (!validation.ok) {
    return new Response("Invalid slug parameter.", { status: 400 });
  }

  try {
    // 1. Authenticate and authorize preview access (throws if not authorized)
    await authorizePreview(request.headers, type);

    // 2. Validate entity exists and get target path
    const redirectPath = await getPreviewRedirectPath(type, slug);
    if (!redirectPath) {
      return new Response("Content not found.", { status: 404 });
    }

    // 3. Enable Next.js Draft Mode
    const draft = await draftMode();
    await draft.enable();

    // 4. Perform safe redirect to canonical internal path
    return NextResponse.redirect(new URL(redirectPath, request.url));
  } catch (error) {
    const isAuthError =
      error instanceof Error &&
      (error.name === "AuthenticationError" ||
        error.name === "AuthenticationAssuranceError" ||
        error.name === "AuthorizationError");

    if (isAuthError) {
      return new Response("Unauthorized or Forbidden preview access.", { status: 403 });
    }

    return new Response("An unexpected error occurred during preview setup.", {
      status: 500
    });
  }
}
