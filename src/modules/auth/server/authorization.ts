import "server-only";

import { authEnv } from "@/config/env/server";
import { prisma } from "@/lib/database";
import { parseRole, type Role } from "@/modules/auth/domain/roles";
import {
  type Action,
  assertCan,
  AuthorizationError,
  type Resource
} from "@/modules/auth/policies/authorization";

import { auth } from "./auth";

export type AuthenticationAssurance =
  | "ANONYMOUS"
  | "PASSWORD_AUTHENTICATED"
  | "PASSWORD_CHANGE_REQUIRED"
  | "TWO_FACTOR_SETUP_REQUIRED"
  | "FULLY_AUTHENTICATED";

export type AuthPrincipal = Readonly<{
  email: string;
  mustChangePassword: boolean;
  name: string;
  recoveryCodesAcknowledged: boolean;
  role: Role;
  sessionCreatedAt: Date;
  sessionExpiresAt: Date;
  sessionId: string;
  twoFactorEnabled: boolean;
  userId: string;
}>;

export class AuthenticationError extends Error {
  public constructor() {
    super("Authentication is required.");
    this.name = "AuthenticationError";
  }
}

export class AuthenticationAssuranceError extends Error {
  public constructor() {
    super("Additional authentication steps are required.");
    this.name = "AuthenticationAssuranceError";
  }
}

function isActiveAccount(banned: boolean | null, banExpires: Date | null): boolean {
  if (banned !== true) {
    return true;
  }
  return banExpires !== null && banExpires <= new Date();
}

export async function getOptionalSession(
  requestHeaders: Headers
): Promise<AuthPrincipal | null> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (session === null) {
    return null;
  }

  const user = session.user;
  const sessionRecord = session.session;
  const currentUser = await prisma.user.findUnique({
    select: {
      banExpires: true,
      banned: true,
      recoveryCodesAcknowledgedAt: true,
      role: true
    },
    where: { id: user.id }
  });
  if (
    currentUser === null ||
    !isActiveAccount(currentUser.banned, currentUser.banExpires)
  ) {
    return null;
  }

  if (
    sessionRecord.createdAt.getTime() + authEnv.absoluteSessionMaxAgeSeconds * 1000 <=
    Date.now()
  ) {
    await prisma.session.deleteMany({ where: { id: sessionRecord.id } });
    return null;
  }

  return {
    email: user.email,
    mustChangePassword: user.mustChangePassword === true,
    name: user.name,
    recoveryCodesAcknowledged: currentUser.recoveryCodesAcknowledgedAt !== null,
    role: parseRole(currentUser.role ?? "editor"),
    sessionCreatedAt: sessionRecord.createdAt,
    sessionExpiresAt: sessionRecord.expiresAt,
    sessionId: sessionRecord.id,
    twoFactorEnabled: user.twoFactorEnabled === true,
    userId: user.id
  };
}

export async function requireSession(requestHeaders: Headers): Promise<AuthPrincipal> {
  const principal = await getOptionalSession(requestHeaders);
  if (principal === null) {
    throw new AuthenticationError();
  }
  return principal;
}

export function getAuthenticationAssurance(
  principal: AuthPrincipal | null
): AuthenticationAssurance {
  if (principal === null) {
    return "ANONYMOUS";
  }
  if (principal.mustChangePassword) {
    return "PASSWORD_CHANGE_REQUIRED";
  }
  if (!principal.twoFactorEnabled || !principal.recoveryCodesAcknowledged) {
    return "TWO_FACTOR_SETUP_REQUIRED";
  }
  return "FULLY_AUTHENTICATED";
}

export async function requireCompletedAuthentication(
  requestHeaders: Headers
): Promise<AuthPrincipal> {
  const principal = await requireSession(requestHeaders);
  if (getAuthenticationAssurance(principal) !== "FULLY_AUTHENTICATED") {
    throw new AuthenticationAssuranceError();
  }
  return principal;
}

export async function requireRole(
  requestHeaders: Headers,
  role: Role
): Promise<AuthPrincipal> {
  const principal = await requireCompletedAuthentication(requestHeaders);
  if (principal.role !== role) {
    throw new AuthorizationError();
  }
  return principal;
}

export async function requirePermission(
  requestHeaders: Headers,
  resource: Resource,
  action: Action
): Promise<AuthPrincipal> {
  const principal = await requireCompletedAuthentication(requestHeaders);
  assertCan(principal.role, { action, resource });
  return principal;
}
