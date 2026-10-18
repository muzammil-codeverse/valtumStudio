import { toNextJsHandler } from "better-auth/next-js";

import { authEnv } from "@/config/env/server";
import {
  SecurityEventOutcome,
  SecurityEventSeverity,
  SecurityEventType
} from "@/generated/prisma/client";
import { prisma } from "@/lib/database";
import { emailSchema } from "@/modules/auth/schemas/credentials";
import { auth } from "@/modules/auth/server/auth";
import { recordSecurityEvent } from "@/server/security/audit/security-events";
import {
  getRequestSecurityContext,
  isTrustedRequestOrigin
} from "@/server/security/request-context/request-context";
import {
  clearAuthenticationFailures,
  hashAuthenticationIdentifier,
  isAuthenticationIdentifierLocked,
  recordAuthenticationFailure
} from "@/server/security/throttling/auth-throttle";

const handler = toNextJsHandler(auth);
const genericAuthenticationFailure = { message: "Invalid email or password." };

type CredentialBody = Readonly<{ email?: unknown; trustDevice?: unknown }>;

async function readCredentialBody(request: Request): Promise<CredentialBody> {
  try {
    const value: unknown = await request.clone().json();
    return value !== null && typeof value === "object" ? (value as CredentialBody) : {};
  } catch {
    return {};
  }
}

function protectedAdminEndpoint(path: string): boolean {
  return (
    path.includes("/admin/") ||
    path.includes("/impersonat") ||
    path.includes("/remove-user")
  );
}

function twoFactorEventType(path: string, succeeded: boolean): SecurityEventType {
  if (path.endsWith("/verify-backup-code")) {
    return succeeded
      ? SecurityEventType.RECOVERY_CODE_USED
      : SecurityEventType.TWO_FACTOR_CHALLENGE_FAILED;
  }
  return succeeded
    ? SecurityEventType.TWO_FACTOR_CHALLENGE_SUCCEEDED
    : SecurityEventType.TWO_FACTOR_CHALLENGE_FAILED;
}

function responseUserId(value: unknown): string | undefined {
  if (value === null || typeof value !== "object" || !("user" in value)) {
    return undefined;
  }
  const user = value.user;
  return user !== null &&
    typeof user === "object" &&
    "id" in user &&
    typeof user.id === "string"
    ? user.id
    : undefined;
}

async function recordTwoFactorOutcome(
  context: ReturnType<typeof getRequestSecurityContext>,
  response: Response
): Promise<void> {
  const responseData: unknown = await response
    .clone()
    .json()
    .catch(() => undefined);
  const succeeded = response.ok;
  await recordSecurityEvent({
    ipAddress: context.ipAddress,
    outcome: succeeded ? SecurityEventOutcome.SUCCEEDED : SecurityEventOutcome.FAILED,
    reasonCode: succeeded ? undefined : "invalid_second_factor",
    requestId: context.requestId,
    severity: succeeded ? SecurityEventSeverity.INFO : SecurityEventSeverity.WARNING,
    type: twoFactorEventType(context.path, succeeded),
    userAgent: context.userAgent,
    userId: responseUserId(responseData)
  });
}

async function recordSignOut(
  context: ReturnType<typeof getRequestSecurityContext>,
  response: Response,
  session: Readonly<{
    session: Readonly<{ id: string }>;
    user: Readonly<{ id: string }>;
  }> | null
): Promise<void> {
  if (!response.ok || session === null) return;
  await recordSecurityEvent({
    ipAddress: context.ipAddress,
    outcome: SecurityEventOutcome.SUCCEEDED,
    requestId: context.requestId,
    sessionId: session.session.id,
    severity: SecurityEventSeverity.INFO,
    type: SecurityEventType.SIGN_OUT,
    userAgent: context.userAgent,
    userId: session.user.id
  });
}

async function recordOriginRejection(request: Request): Promise<Response> {
  const context = getRequestSecurityContext(request);
  await recordSecurityEvent({
    ipAddress: context.ipAddress,
    outcome: SecurityEventOutcome.DENIED,
    reasonCode: "untrusted_origin",
    requestId: context.requestId,
    severity: SecurityEventSeverity.WARNING,
    type: SecurityEventType.UNTRUSTED_ORIGIN_REJECTED,
    userAgent: context.userAgent
  });
  return Response.json({ message: "Request could not be completed." }, { status: 403 });
}

export const GET = handler.GET;

export async function POST(request: Request): Promise<Response> {
  const context = getRequestSecurityContext(request);
  if (!isTrustedRequestOrigin(context.origin)) {
    return recordOriginRejection(request);
  }

  if (context.path.endsWith("/sign-up/email") || protectedAdminEndpoint(context.path)) {
    return Response.json({ message: "Not found." }, { status: 404 });
  }

  const body = await readCredentialBody(request);
  if (
    context.path.includes("/two-factor/") &&
    body.trustDevice !== undefined &&
    body.trustDevice !== false
  ) {
    return Response.json(
      { message: "Request could not be completed." },
      { status: 400 }
    );
  }

  let identifierHash: string | undefined;
  let normalizedEmail: string | undefined;
  if (context.path.endsWith("/sign-in/email") && typeof body.email === "string") {
    try {
      normalizedEmail = emailSchema.parse(body.email);
      identifierHash = hashAuthenticationIdentifier(
        normalizedEmail,
        authEnv.identifierHashKey
      );
      if (await isAuthenticationIdentifierLocked(identifierHash)) {
        return Response.json(genericAuthenticationFailure, { status: 401 });
      }
    } catch {
      return Response.json(genericAuthenticationFailure, { status: 401 });
    }
  }

  const signOutSession = context.path.endsWith("/sign-out")
    ? await auth.api.getSession({ headers: request.headers })
    : null;
  const response = await handler.POST(request);
  if (
    context.path.endsWith("/two-factor/verify-totp") ||
    context.path.endsWith("/two-factor/verify-backup-code")
  ) {
    await recordTwoFactorOutcome(context, response);
  }
  if (context.path.endsWith("/sign-out")) {
    await recordSignOut(context, response, signOutSession);
  }
  if (!context.path.endsWith("/sign-in/email")) {
    return response;
  }

  if (!response.ok) {
    if (identifierHash !== undefined && response.status !== 429) {
      const throttle = await recordAuthenticationFailure(identifierHash, {
        lockSeconds: authEnv.failedLoginLockSeconds,
        maxAttempts: authEnv.failedLoginMaxAttempts,
        windowSeconds: authEnv.failedLoginWindowSeconds
      });
      await recordSecurityEvent({
        identifierHash,
        ipAddress: context.ipAddress,
        outcome: SecurityEventOutcome.FAILED,
        reasonCode: throttle.justLocked ? "threshold_reached" : "invalid_credentials",
        requestId: context.requestId,
        severity: throttle.justLocked
          ? SecurityEventSeverity.WARNING
          : SecurityEventSeverity.INFO,
        type: throttle.justLocked
          ? SecurityEventType.ACCOUNT_TEMPORARILY_LOCKED
          : SecurityEventType.SIGN_IN_FAILED,
        userAgent: context.userAgent
      });
    }
    return Response.json(genericAuthenticationFailure, { status: 401 });
  }

  const responseData: unknown = await response
    .clone()
    .json()
    .catch(() => undefined);
  const isTwoFactorChallenge =
    responseData !== null &&
    typeof responseData === "object" &&
    "twoFactorRedirect" in responseData &&
    responseData.twoFactorRedirect === true;
  if (
    !isTwoFactorChallenge &&
    identifierHash !== undefined &&
    normalizedEmail !== undefined
  ) {
    await clearAuthenticationFailures(identifierHash);
    const user = await prisma.user.findUnique({
      select: { id: true },
      where: { email: normalizedEmail }
    });
    await recordSecurityEvent({
      identifierHash,
      ipAddress: context.ipAddress,
      outcome: SecurityEventOutcome.SUCCEEDED,
      requestId: context.requestId,
      severity: SecurityEventSeverity.INFO,
      type: SecurityEventType.SIGN_IN_SUCCEEDED,
      userAgent: context.userAgent,
      userId: user?.id
    });
  }

  return response;
}
