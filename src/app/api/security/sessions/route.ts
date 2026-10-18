import {
  SecurityEventOutcome,
  SecurityEventSeverity,
  SecurityEventType
} from "@/generated/prisma/client";
import { prisma } from "@/lib/database";
import { requireCompletedAuthentication } from "@/modules/auth/server/authorization";
import { recordSecurityEvent } from "@/server/security/audit/security-events";
import {
  getRequestSecurityContext,
  isTrustedRequestOrigin
} from "@/server/security/request-context/request-context";

function summarizeUserAgent(userAgent: string | null): string {
  if (userAgent === null || userAgent.length === 0) {
    return "Unknown device";
  }
  if (/firefox/i.test(userAgent)) return "Firefox browser";
  if (/edg/i.test(userAgent)) return "Microsoft Edge browser";
  if (/chrome|chromium/i.test(userAgent)) return "Chromium browser";
  if (/safari/i.test(userAgent)) return "Safari browser";
  return "Browser session";
}

export async function GET(request: Request): Promise<Response> {
  const principal = await requireCompletedAuthentication(request.headers).catch(
    () => null
  );
  if (principal === null) {
    return Response.json({ message: "Authentication is required." }, { status: 401 });
  }

  const sessions = await prisma.session.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      createdAt: true,
      expiresAt: true,
      id: true,
      ipAddress: true,
      updatedAt: true,
      userAgent: true
    },
    where: { expiresAt: { gt: new Date() }, userId: principal.userId }
  });
  return Response.json({
    sessions: sessions.map((session) => ({
      createdAt: session.createdAt,
      current: session.id === principal.sessionId,
      device: summarizeUserAgent(session.userAgent),
      expiresAt: session.expiresAt,
      id: session.id,
      ipAddress: session.ipAddress === null ? undefined : "Recorded",
      updatedAt: session.updatedAt
    }))
  });
}

export async function DELETE(request: Request): Promise<Response> {
  const context = getRequestSecurityContext(request);
  if (!isTrustedRequestOrigin(context.origin)) {
    return Response.json(
      { message: "Request could not be completed." },
      { status: 403 }
    );
  }
  const principal = await requireCompletedAuthentication(request.headers).catch(
    () => null
  );
  if (principal === null) {
    return Response.json({ message: "Authentication is required." }, { status: 401 });
  }
  const body: unknown = await request.json().catch(() => null);
  const sessionId =
    body !== null &&
    typeof body === "object" &&
    typeof (body as { sessionId?: unknown }).sessionId === "string"
      ? (body as { sessionId: string }).sessionId
      : undefined;
  const allOtherSessions =
    body !== null &&
    typeof body === "object" &&
    (body as { allOtherSessions?: unknown }).allOtherSessions === true;
  if (sessionId === undefined && !allOtherSessions) {
    return Response.json({ message: "Select a session to revoke." }, { status: 400 });
  }
  if (sessionId === principal.sessionId) {
    return Response.json(
      { message: "Use sign out to end the current session." },
      { status: 400 }
    );
  }

  const where = allOtherSessions
    ? { id: { not: principal.sessionId }, userId: principal.userId }
    : { id: sessionId as string, userId: principal.userId };
  const deletion = await prisma.session.deleteMany({ where });
  if (deletion.count === 0) {
    return Response.json(
      { message: "The selected session is unavailable." },
      { status: 404 }
    );
  }
  await recordSecurityEvent({
    ipAddress: context.ipAddress,
    outcome: SecurityEventOutcome.SUCCEEDED,
    requestId: context.requestId,
    sessionId: principal.sessionId,
    severity: SecurityEventSeverity.INFO,
    type: allOtherSessions
      ? SecurityEventType.OTHER_SESSIONS_REVOKED
      : SecurityEventType.SESSION_REVOKED,
    userAgent: context.userAgent,
    userId: principal.userId
  });
  return Response.json({ status: "ok" });
}
