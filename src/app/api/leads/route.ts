import { NextResponse } from "next/server";

import { LeadSubmissionError, submitLead } from "@/modules/leads/server/submission";
import {
  getRequestSecurityContext,
  isTrustedRequestOrigin
} from "@/server/security/request-context/request-context";

const MAX_BODY_BYTES = 20_000;

function acceptedResponse(): NextResponse {
  return NextResponse.json({ accepted: true }, { status: 202 });
}

export async function POST(request: Request): Promise<NextResponse> {
  const context = getRequestSecurityContext(request);
  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = request.headers.get("content-length");
  if (
    !contentType.toLowerCase().startsWith("application/json") ||
    !isTrustedRequestOrigin(context.origin) ||
    (contentLength !== null && Number(contentLength) > MAX_BODY_BYTES)
  ) {
    return NextResponse.json({ accepted: false }, { status: 400 });
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ accepted: false }, { status: 413 });
    }
    body = JSON.parse(text) as unknown;
  } catch {
    return NextResponse.json({ accepted: false }, { status: 400 });
  }

  try {
    await submitLead({ payload: body, requesterIdentifier: context.ipAddress });
    return acceptedResponse();
  } catch (error) {
    if (error instanceof LeadSubmissionError) {
      const status =
        error.code === "RATE_LIMITED" ? 429 : error.code === "INVALID" ? 400 : 500;
      return NextResponse.json({ accepted: false }, { status });
    }
    return NextResponse.json({ accepted: false }, { status: 500 });
  }
}
