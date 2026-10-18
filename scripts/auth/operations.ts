import { randomBytes, randomUUID } from "node:crypto";

import {
  type Prisma,
  SecurityEventOutcome,
  SecurityEventSeverity,
  SecurityEventType
} from "@/generated/prisma/client";
import {
  emailSchema,
  validatePasswordForEmail
} from "@/modules/auth/schemas/credentials";

import { auth, prisma } from "./schema-generation-config";

const OWNER_GUARD_LOCK = 4_815_162_342;

export type ProvisionedUser = Readonly<{
  email: string;
  id: string;
  name: string;
  role: "owner" | "admin" | "editor";
}>;

function generateTemporaryPassword(): string {
  return `Sg!${randomBytes(24).toString("base64url")}9a`;
}

async function createCredentialUser(
  transaction: Prisma.TransactionClient,
  input: Readonly<{
    email: string;
    name: string;
    password: string;
    role: ProvisionedUser["role"];
  }>
): Promise<ProvisionedUser> {
  const existing = await transaction.user.findUnique({ where: { email: input.email } });
  if (existing !== null) {
    throw new Error("An account with that email already exists.");
  }

  const passwordHash = await (await auth.$context).password.hash(input.password);
  const id = randomUUID();
  const user = await transaction.user.create({
    data: {
      email: input.email,
      emailVerified: true,
      id,
      mustChangePassword: true,
      name: input.name.trim(),
      role: input.role
    }
  });
  await transaction.account.create({
    data: {
      accountId: id,
      id: randomUUID(),
      password: passwordHash,
      providerId: "credential",
      userId: id
    }
  });
  return { email: user.email, id: user.id, name: user.name, role: input.role };
}

export async function bootstrapOwner(
  input: Readonly<{ email: string; name: string }>
): Promise<{
  password: string;
  user: ProvisionedUser;
}> {
  if (process.env["AUTH_BOOTSTRAP_ENABLED"] !== "true") {
    throw new Error(
      "AUTH_BOOTSTRAP_ENABLED=true is required for the one-time owner bootstrap command."
    );
  }
  const email = emailSchema.parse(input.email);
  if (input.name.trim().length < 2 || input.name.trim().length > 120) {
    throw new Error("Owner name must contain between 2 and 120 characters.");
  }
  const password = generateTemporaryPassword();
  validatePasswordForEmail(password, email);

  const user = await prisma.$transaction(
    async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(${OWNER_GUARD_LOCK})`;
      if ((await transaction.user.count()) !== 0) {
        throw new Error("Bootstrap is permitted only when no users exist.");
      }
      const created = await createCredentialUser(transaction, {
        email,
        name: input.name,
        password,
        role: "owner"
      });
      await transaction.securityEvent.create({
        data: {
          outcome: SecurityEventOutcome.SUCCEEDED,
          severity: SecurityEventSeverity.HIGH,
          type: SecurityEventType.ACCOUNT_CREATED,
          userId: created.id
        }
      });
      await transaction.securityEvent.create({
        data: {
          outcome: SecurityEventOutcome.SUCCEEDED,
          severity: SecurityEventSeverity.CRITICAL,
          type: SecurityEventType.OWNER_BOOTSTRAPPED,
          userId: created.id
        }
      });
      return created;
    },
    { isolationLevel: "Serializable" }
  );
  return { password, user };
}

export async function resetUserPassword(
  emailInput: string
): Promise<{ password: string; userId: string }> {
  const email = emailSchema.parse(emailInput);
  const password = generateTemporaryPassword();
  validatePasswordForEmail(password, email);
  const passwordHash = await (await auth.$context).password.hash(password);
  const result = await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({ where: { email } });
    if (user === null) throw new Error("No account exists for that email.");
    const credential = await transaction.account.findFirst({
      where: { providerId: "credential", userId: user.id }
    });
    if (credential === null) {
      await transaction.account.create({
        data: {
          accountId: user.id,
          id: randomUUID(),
          password: passwordHash,
          providerId: "credential",
          userId: user.id
        }
      });
    } else {
      await transaction.account.update({
        data: { password: passwordHash },
        where: { id: credential.id }
      });
    }
    await transaction.user.update({
      data: { lastPasswordChangedAt: new Date(), mustChangePassword: true },
      where: { id: user.id }
    });
    await transaction.session.deleteMany({ where: { userId: user.id } });
    await transaction.securityEvent.create({
      data: {
        outcome: SecurityEventOutcome.SUCCEEDED,
        severity: SecurityEventSeverity.HIGH,
        type: SecurityEventType.PASSWORD_RESET_BY_OPERATOR,
        userId: user.id
      }
    });
    return { userId: user.id };
  });
  return { password, ...result };
}

export async function resetUserTwoFactor(
  emailInput: string
): Promise<{ userId: string }> {
  const email = emailSchema.parse(emailInput);
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({ where: { email } });
    if (user === null) throw new Error("No account exists for that email.");
    await transaction.twoFactor.deleteMany({ where: { userId: user.id } });
    await transaction.user.update({
      data: {
        mustChangePassword: true,
        recoveryCodesAcknowledgedAt: null,
        twoFactorEnabled: false
      },
      where: { id: user.id }
    });
    await transaction.session.deleteMany({ where: { userId: user.id } });
    await transaction.securityEvent.create({
      data: {
        outcome: SecurityEventOutcome.SUCCEEDED,
        severity: SecurityEventSeverity.HIGH,
        type: SecurityEventType.TWO_FACTOR_DISABLED,
        userId: user.id
      }
    });
    return { userId: user.id };
  });
}

export async function revokeUserSessions(
  emailInput: string
): Promise<{ revoked: number; userId: string }> {
  const email = emailSchema.parse(emailInput);
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({ where: { email } });
    if (user === null) throw new Error("No account exists for that email.");
    const deletion = await transaction.session.deleteMany({
      where: { userId: user.id }
    });
    await transaction.securityEvent.create({
      data: {
        metadata: { revoked: deletion.count },
        outcome: SecurityEventOutcome.SUCCEEDED,
        severity: SecurityEventSeverity.INFO,
        type: SecurityEventType.OTHER_SESSIONS_REVOKED,
        userId: user.id
      }
    });
    return { revoked: deletion.count, userId: user.id };
  });
}

async function assertOwnerInvariant(
  transaction: Prisma.TransactionClient,
  userId: string,
  removeOwner: boolean
): Promise<void> {
  if (!removeOwner) return;
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(${OWNER_GUARD_LOCK})`;
  const activeOwners = await transaction.user.count({
    where: {
      OR: [{ banned: false }, { banExpires: { lte: new Date() } }],
      role: "owner"
    }
  });
  const user = await transaction.user.findUnique({ where: { id: userId } });
  if (user?.role === "owner" && activeOwners <= 1) {
    throw new Error("The last active owner cannot be demoted or banned.");
  }
}

/** Controlled operator primitive; there is deliberately no user-deletion primitive. */
export async function changeUserRole(
  userId: string,
  role: ProvisionedUser["role"]
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await assertOwnerInvariant(transaction, userId, role !== "owner");
    await transaction.user.update({ data: { role }, where: { id: userId } });
    await transaction.securityEvent.create({
      data: {
        outcome: SecurityEventOutcome.SUCCEEDED,
        severity: SecurityEventSeverity.HIGH,
        type: SecurityEventType.ROLE_CHANGED,
        userId
      }
    });
  });
}

/** Controlled operator primitive; bans, rather than deletes, preserve audit history. */
export async function setUserBan(
  userId: string,
  banned: boolean,
  reason?: string
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await assertOwnerInvariant(transaction, userId, banned);
    await transaction.user.update({
      data: {
        banExpires: null,
        banReason: banned ? (reason?.slice(0, 256) ?? "operator_action") : null,
        banned
      },
      where: { id: userId }
    });
    await transaction.session.deleteMany({ where: { userId } });
    await transaction.securityEvent.create({
      data: {
        outcome: SecurityEventOutcome.SUCCEEDED,
        severity: SecurityEventSeverity.HIGH,
        type: banned
          ? SecurityEventType.ACCOUNT_BANNED
          : SecurityEventType.ACCOUNT_UNBANNED,
        userId
      }
    });
  });
}
