import { type NextRequest, NextResponse } from "next/server";

import {
  CONSENT_AGE_SECONDS,
  CONSENT_COOKIE,
  CONSENT_REVISION,
  parseCookieChoices
} from "@/modules/public-site/studio/cookie-policy";
import {
  getRequestSecurityContext,
  isTrustedRequestOrigin
} from "@/server/security/request-context/request-context";

export const dynamic = "force-dynamic";

function noStore(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function GET(request: NextRequest): NextResponse {
  const raw = request.cookies.get(CONSENT_COOKIE)?.value;
  return noStore({ choices: parseCookieChoices(raw) });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const context = getRequestSecurityContext(request);
  const length = request.headers.get("content-length");
  if (
    !isTrustedRequestOrigin(context.origin) ||
    !request.headers.get("content-type")?.startsWith("application/json") ||
    (length && Number(length) > 2048)
  ) {
    return noStore({ accepted: false }, 400);
  }
  let body: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > 2048) {
      return noStore({ accepted: false }, 413);
    }
    body = JSON.parse(text) as unknown;
  } catch {
    return noStore({ accepted: false }, 400);
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("analytics" in body) ||
    typeof body.analytics !== "boolean" ||
    !("functional" in body) ||
    typeof body.functional !== "boolean" ||
    Object.keys(body).some((key) => key !== "analytics" && key !== "functional")
  ) {
    return noStore({ accepted: false }, 400);
  }

  const choices = {
    revision: CONSENT_REVISION,
    analytics: body.analytics,
    functional: body.functional,
    updatedAt: Date.now()
  };
  const response = noStore({ accepted: true, choices });
  response.cookies.set({
    name: CONSENT_COOKIE,
    value: JSON.stringify(choices),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CONSENT_AGE_SECONDS
  });
  return response;
}
