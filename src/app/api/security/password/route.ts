import { isAPIError } from "better-auth/api";

import {
  SecurityEventOutcome,
  SecurityEventSeverity,
  SecurityEventType
} from "@/generated/prisma/client";
import { prisma } from "@/lib/database";
import { logger } from "@/lib/logging";
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

  let newPassword: string;
  try {
    newPassword = validatePasswordForEmail(body.newPassword, principal.email);
  } catch {
    return Response.json(
      { message: "Choose a different password that meets the password requirements." },
      { status: 400 }
    );
  }

  const responseHeaders = new Headers({ "Cache-Control": "no-store" });
  let changed = false;
  try {
    // Better Auth throws INVALID_PASSWORD for a nonmatching candidate. That is
    // precisely the expected result when checking that a new password is unique.
    const samePassword = await auth.api
      .verifyPassword({
        body: { password: newPassword },
        headers: request.headers
      })
      .catch((error: unknown) => {
        if (isAPIError(error) && error.body?.code === "INVALID_PASSWORD") {
          return { status: false };
        }
        throw error;
      });
    if (samePassword.status) {
      return Response.json(
        { message: "Choose a password you have not used for this account." },
        { status: 400 }
      );
    }

    // Better Auth revokes the old sessions and issues a replacement. Preserve
    // that replacement and forward its cookies; never delete it or audit
    // against the now-revoked principal.sessionId.
    const { headers, response } = await auth.api.changePassword({
      body: {
        currentPassword: body.currentPassword,
        newPassword,
        revokeOtherSessions: true
      },
      headers: request.headers,
      returnHeaders: true
    });
    changed = true;
    for (const cookie of headers.getSetCookie()) {
      responseHeaders.append("Set-Cookie", cookie);
    }

    if (response.token === null) {
      throw new Error("Password change did not issue a replacement session.");
    }
    await prisma.$transaction(async (transaction) => {
      const session = await transaction.session.findUniqueOrThrow({
        select: { id: true, userId: true },
        where: { token: response.token ?? "" }
      });
      if (session.userId !== principal.userId) {
        throw new Error("Replacement session does not match the authenticated user.");
      }
      await transaction.user.update({
        data: { lastPasswordChangedAt: new Date(), mustChangePassword: false },
        where: { id: principal.userId }
      });
      await recordSecurityEvent(
        {
          ipAddress: context.ipAddress,
          outcome: SecurityEventOutcome.SUCCEEDED,
          requestId: context.requestId,
          sessionId: session.id,
          severity: SecurityEventSeverity.INFO,
          type: SecurityEventType.PASSWORD_CHANGED,
          userAgent: context.userAgent,
          userId: principal.userId
        },
        transaction
      );
      await recordSecurityEvent(
        {
          outcome: SecurityEventOutcome.SUCCEEDED,
          reasonCode: "password_change",
          sessionId: session.id,
          severity: SecurityEventSeverity.INFO,
          type: SecurityEventType.OTHER_SESSIONS_REVOKED,
          userId: principal.userId
        },
        transaction
      );
    });
    return Response.json({ status: "ok" }, { headers: responseHeaders });
  } catch (error) {
    if (!changed && isAPIError(error) && error.body?.code === "INVALID_PASSWORD") {
      return Response.json(
        { message: "The current password could not be verified." },
        { status: 400 }
      );
    }
    // Never log the submitted credentials or issued session token.
    logger.warn("Account security update failed.", {
      requestId: context.requestId,
      stage: changed ? "onboarding" : "credential_update"
    });
    return Response.json(
      {
        message: changed
          ? "Your password changed, but setup could not be completed. Sign in with your new password to continue."
          : "Password change could not be completed."
      },
      { headers: responseHeaders, status: 503 }
    );
  }
}
