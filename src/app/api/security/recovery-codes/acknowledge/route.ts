import {
  SecurityEventOutcome,
  SecurityEventSeverity,
  SecurityEventType
} from "@/generated/prisma/client";
import { prisma } from "@/lib/database";
import { requireSession } from "@/modules/auth/server/authorization";
import { recordSecurityEvent } from "@/server/security/audit/security-events";
import {
  getRequestSecurityContext,
  isTrustedRequestOrigin
} from "@/server/security/request-context/request-context";

export async function POST(request: Request): Promise<Response> {
  const context = getRequestSecurityContext(request);
  if (!isTrustedRequestOrigin(context.origin)) {
    return Response.json(
      { message: "Request could not be completed." },
      { status: 403 }
    );
  }
  const principal = await requireSession(request.headers).catch(() => null);
  if (principal === null || !principal.twoFactorEnabled) {
    return Response.json({ message: "Authentication is required." }, { status: 401 });
  }

  await prisma.user.update({
    data: { recoveryCodesAcknowledgedAt: new Date() },
    where: { id: principal.userId }
  });
  await recordSecurityEvent({
    ipAddress: context.ipAddress,
    outcome: SecurityEventOutcome.SUCCEEDED,
    requestId: context.requestId,
    sessionId: principal.sessionId,
    severity: SecurityEventSeverity.INFO,
    type: SecurityEventType.TWO_FACTOR_ENABLED,
    userAgent: context.userAgent,
    userId: principal.userId
  });
  return Response.json({ status: "ok" });
}
