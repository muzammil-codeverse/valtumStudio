import {
  SecurityEventOutcome,
  SecurityEventSeverity,
  SecurityEventType
} from "@/generated/prisma/client";
import { prisma } from "@/lib/database";
import { validatePasswordForEmail } from "@/modules/auth/schemas/credentials";
import { auth } from "@/modules/auth/server/auth";
import { requireSession } from "@/modules/auth/server/authorization";
import { recordSecurityEvent } from "@/server/security/audit/security-events";
import {
  getRequestSecurityContext,
  isTrustedRequestOrigin
} from "@/server/security/request-context/request-context";

type PasswordChangeBody = Readonly<{
  currentPassword?: unknown;
  newPassword?: unknown;
}>;
type ValidPasswordChangeBody = Readonly<{
  currentPassword: string;
  newPassword: string;
}>;

function isPasswordChangeBody(value: unknown): value is ValidPasswordChangeBody {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as PasswordChangeBody).currentPassword === "string" &&
    typeof (value as PasswordChangeBody).newPassword === "string"
  );
}

export async function POST(request: Request): Promise<Response> {
  const context = getRequestSecurityContext(request);
  if (!isTrustedRequestOrigin(context.origin)) {
    return Response.json(
      { message: "Request could not be completed." },
      { status: 403 }
    );
  }

  const principal = await requireSession(request.headers).catch(() => null);
  if (principal === null) {
    await recordSecurityEvent({
      ipAddress: context.ipAddress,
      outcome: SecurityEventOutcome.DENIED,
      reasonCode: "authentication_required",
      requestId: context.requestId,
      severity: SecurityEventSeverity.WARNING,
      type: SecurityEventType.UNAUTHORIZED_ACCESS_DENIED,
      userAgent: context.userAgent
    });
    return Response.json({ message: "Authentication is required." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!isPasswordChangeBody(body)) {
    return Response.json(
      { message: "Enter your current and new password." },
      { status: 400 }
    );
  }

  try {
    const newPassword = validatePasswordForEmail(body.newPassword, principal.email);
    const samePassword = await auth.api.verifyPassword({
      body: { password: newPassword },
      headers: request.headers
    });
    if (samePassword.status) {
      return Response.json(
        { message: "Choose a password you have not used for this account." },
        { status: 400 }
      );
    }

    await auth.api.changePassword({
      body: {
        currentPassword: body.currentPassword,
        newPassword,
        revokeOtherSessions: true
      },
      headers: request.headers
    });
    await prisma.user.update({
      data: { lastPasswordChangedAt: new Date(), mustChangePassword: false },
      where: { id: principal.userId }
    });
    await prisma.session.deleteMany({
      where: { id: { not: principal.sessionId }, userId: principal.userId }
    });
    await recordSecurityEvent({
      ipAddress: context.ipAddress,
      outcome: SecurityEventOutcome.SUCCEEDED,
      requestId: context.requestId,
      sessionId: principal.sessionId,
      severity: SecurityEventSeverity.INFO,
      type: SecurityEventType.PASSWORD_CHANGED,
      userAgent: context.userAgent,
      userId: principal.userId
    });
    await recordSecurityEvent({
      outcome: SecurityEventOutcome.SUCCEEDED,
      reasonCode: "password_change",
      sessionId: principal.sessionId,
      severity: SecurityEventSeverity.INFO,
      type: SecurityEventType.OTHER_SESSIONS_REVOKED,
      userId: principal.userId
    });
    return Response.json({ status: "ok" });
  } catch {
    return Response.json(
      { message: "Password change could not be completed." },
      { status: 400 }
    );
  }
}
