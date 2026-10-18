import { draftMode } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

function isSafeRedirectPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("\\")) {
    return false;
  }
  // Prevent open redirects to administrative or API domains
  if (
    path.startsWith("/api") ||
    path.startsWith("/auth") ||
    path.startsWith("/admin")
  ) {
    return false;
  }
  // Prevent remote hosts injection
  if (/:|@|localhost|127\.0\.0\.1/.test(path)) {
    return false;
  }
  return true;
}

/**
 * Endpoint: GET /api/preview/disable?to=<path>
 * Disables Next.js Draft Mode and redirects to the safe internal path.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const toParam = searchParams.get("to") || "/";

  // Validate the redirect target
  const target = isSafeRedirectPath(toParam) ? toParam : "/";

  // Disable draft mode
  const draft = await draftMode();
  await draft.disable();

  return NextResponse.redirect(new URL(target, request.url));
}
