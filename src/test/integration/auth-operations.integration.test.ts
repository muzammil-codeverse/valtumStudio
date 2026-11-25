import { afterAll, describe, expect, it } from "vitest";

import {
  bootstrapOwner,
  changeUserRole,
  resetUserTwoFactor,
  revokeUserSessions,
  setUserBan
} from "../../../scripts/auth/operations";
import { prisma as operatorPrisma } from "../../../scripts/auth/schema-generation-config";
import { GET as authGet, POST as authPost } from "../../app/api/auth/[...all]/route";
import { POST as passwordPost } from "../../app/api/security/password/route";

let ownerEmail = "";
let ownerPassword = "";
let ownerSessionCookie = "";

function authRequest(
  path: string,
  body: Record<string, unknown>,
  origin = "http://127.0.0.1:3000"
): Request {
  return new Request(`http://127.0.0.1:3000${path}`, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", origin },
    method: "POST"
  });
}

describe("authentication operator workflows", () => {
  it("bootstraps exactly one owner and records the event", async () => {
    process.env["AUTH_BOOTSTRAP_ENABLED"] = "true";
    const result = await bootstrapOwner({
      email: "owner@example.test",
      name: "Initial Owner"
    });
    ownerEmail = result.user.email;
    ownerPassword = result.password;
    expect(result.password.length).toBeGreaterThan(24);
    await expect(
      bootstrapOwner({ email: "second@example.test", name: "Second Owner" })
    ).rejects.toThrow("no users exist");
    await expect(
      operatorPrisma.securityEvent.findFirstOrThrow({
        where: { type: "OWNER_BOOTSTRAPPED", userId: result.user.id }
      })
    ).resolves.toBeDefined();
  });

  it("blocks public registration, rejects untrusted origins, and issues hardened login cookies", async () => {
    await expect(
      authPost(
        authRequest("/api/auth/sign-up/email", {
          email: "attacker@example.test",
          name: "Attacker",
          password: ownerPassword
        })
      )
    ).resolves.toMatchObject({ status: 404 });
    await expect(
      authPost(
        authRequest(
          "/api/auth/sign-in/email",
          { email: ownerEmail, password: ownerPassword },
          "https://attacker.example"
        )
      )
    ).resolves.toMatchObject({ status: 403 });
    await expect(
      authPost(
        authRequest("/api/auth/sign-in/email", {
          email: ownerEmail,
          password: "invalid-password-value"
        })
      )
    ).resolves.toMatchObject({ status: 401 });

    const response = await authPost(
      authRequest("/api/auth/sign-in/email", {
        email: ownerEmail,
        password: ownerPassword
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=Lax");
    ownerSessionCookie = response.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";", 1)[0])
      .join("; ");
    await expect(
      operatorPrisma.securityEvent.count({
        where: { type: "UNTRUSTED_ORIGIN_REJECTED" }
      })
    ).resolves.toBe(1);
  });

  it("changes the initial owner password and retains only the replacement session", async () => {
    const passwordRequest = (currentPassword: string, newPassword: string) =>
      new Request("http://127.0.0.1:3000/api/security/password", {
        body: JSON.stringify({ currentPassword, newPassword }),
        headers: {
          "content-type": "application/json",
          cookie: ownerSessionCookie,
          origin: "http://127.0.0.1:3000"
        },
        method: "POST"
      });

    const unchanged = await passwordPost(passwordRequest(ownerPassword, ownerPassword));
    expect(unchanged.status).toBe(400);
    expect(await unchanged.json()).toEqual({
      message: "Choose a password you have not used for this account."
    });

    const secondLogin = await authPost(
      authRequest("/api/auth/sign-in/email", {
        email: ownerEmail,
        password: ownerPassword
      })
    );
    expect(secondLogin.status).toBe(200);

    const nextPassword = "T7!changed-credential-for-integration";
    const changed = await passwordPost(passwordRequest(ownerPassword, nextPassword));
    expect(changed.status).toBe(200);
    expect(await changed.json()).toEqual({ status: "ok" });
    expect(changed.headers.get("set-cookie")).toContain("HttpOnly");
    const replacementCookie = changed.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";", 1)[0])
      .join("; ");
    expect(replacementCookie).not.toBe(ownerSessionCookie);

    const owner = await operatorPrisma.user.findUniqueOrThrow({
      where: { email: ownerEmail }
    });
    expect(owner.mustChangePassword).toBe(false);
    expect(owner.lastPasswordChangedAt).not.toBeNull();
    const sessions = await operatorPrisma.session.findMany({
      where: { userId: owner.id }
    });
    expect(sessions).toHaveLength(1);
    const [replacementSession] = sessions;
    if (replacementSession === undefined) {
      throw new Error("Expected a replacement session.");
    }

    const getSession = (cookie: string) =>
      authGet(
        new Request("http://127.0.0.1:3000/api/auth/get-session", {
          headers: { cookie }
        })
      );
    const revoked = await getSession(ownerSessionCookie);
    expect(await revoked.json()).toBeNull();
    const active = await getSession(replacementCookie);
    expect(await active.json()).toMatchObject({
      user: { email: ownerEmail, mustChangePassword: false }
    });
    await expect(
      operatorPrisma.securityEvent.count({
        where: {
          sessionId: replacementSession.id,
          type: { in: ["PASSWORD_CHANGED", "OTHER_SESSIONS_REVOKED"] },
          userId: owner.id
        }
      })
    ).resolves.toBe(2);
  });

  it("prevents losing the last owner and resets/revokes user security state", async () => {
    const owner = await operatorPrisma.user.findUniqueOrThrow({
      where: { email: "owner@example.test" }
    });
    await expect(changeUserRole(owner.id, "editor")).rejects.toThrow(
      "last active owner"
    );
    await expect(setUserBan(owner.id, true)).rejects.toThrow("last active owner");

    await operatorPrisma.twoFactor.create({
      data: {
        backupCodes: "protected",
        id: "two-factor-test",
        secret: "protected",
        userId: owner.id
      }
    });
    await operatorPrisma.user.update({
      data: { recoveryCodesAcknowledgedAt: new Date(), twoFactorEnabled: true },
      where: { id: owner.id }
    });
    await operatorPrisma.session.create({
      data: {
        expiresAt: new Date(Date.now() + 60_000),
        id: "session-test",
        token: "session-test-token",
        userId: owner.id
      }
    });
    const revocation = await revokeUserSessions(owner.email);
    expect(revocation.revoked).toBeGreaterThanOrEqual(1);
    await operatorPrisma.session.create({
      data: {
        expiresAt: new Date(Date.now() + 60_000),
        id: "session-test-2",
        token: "session-test-token-2",
        userId: owner.id
      }
    });
    await resetUserTwoFactor(owner.email);
    await expect(
      operatorPrisma.twoFactor.count({ where: { userId: owner.id } })
    ).resolves.toBe(0);
    await expect(
      operatorPrisma.user.findUniqueOrThrow({ where: { id: owner.id } })
    ).resolves.toMatchObject({
      mustChangePassword: true,
      recoveryCodesAcknowledgedAt: null,
      twoFactorEnabled: false
    });
    await expect(
      operatorPrisma.session.count({ where: { userId: owner.id } })
    ).resolves.toBe(0);
  });
});

afterAll(async () => {
  await operatorPrisma.$disconnect();
});
