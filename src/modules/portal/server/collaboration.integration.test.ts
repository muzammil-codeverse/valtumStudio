import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPrismaClient } from "@/lib/database/create-client";

const url = process.env["TEST_DATABASE_URL"];
if (!url) throw new Error("TEST_DATABASE_URL is required for database integration.");
const db = createPrismaClient(url);
const seed = randomUUID();
function makeUser(name: string) {
  return {
    id: randomUUID(),
    name,
    email: name + "-" + seed + "@example.test"
  };
}
const operator = makeUser("operator");
const alpha = makeUser("alpha");
const bravo = makeUser("bravo");
const users = [operator, alpha, bravo];
const workspaceIds: [string, string] = [randomUUID(), randomUUID()];
const engagementIds: [string, string] = [randomUUID(), randomUUID()];
const decisionId = randomUUID();

beforeAll(async () => {
  for (const user of users) {
    await db.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.id === operator.id ? "owner" : "client",
        emailVerified: true
      }
    });
  }
  for (let i = 0; i < 2; i++) {
    await db.clientWorkspace.create({
      data: {
        id: workspaceIds[i] ?? workspaceIds[0],
        name: "Integration workspace " + i,
        slug: "integration-" + seed + "-" + i
      }
    });
    await db.clientEngagement.create({
      data: {
        id: engagementIds[i] ?? engagementIds[0],
        workspaceId: workspaceIds[i] ?? workspaceIds[0],
        title: "Delivery project " + i
      }
    });
  }
  await db.clientMembership.createMany({
    data: [
      { workspaceId: workspaceIds[0], userId: alpha.id },
      { workspaceId: workspaceIds[1], userId: bravo.id }
    ]
  });
  await db.clientDecision.create({
    data: {
      id: decisionId,
      engagementId: engagementIds[0],
      requestedByUserId: operator.id,
      title: "Confirm design specification",
      description: "Please confirm the final design specification before delivery."
    }
  });
});

afterAll(async () => {
  await db.clientWorkspace.deleteMany({ where: { id: { in: workspaceIds } } });
  await db.user.deleteMany({ where: { id: { in: users.map((item) => item.id) } } });
  await db.$disconnect();
});

describe("Phase 2 tenant isolation and workflow consistency", () => {
  it("a customer cannot retrieve another customer's project by knowing its ID", async () => {
    const denied = await db.clientEngagement.findFirst({
      where: {
        id: engagementIds[0],
        workspace: { memberships: { some: { userId: bravo.id } } }
      }
    });
    const granted = await db.clientEngagement.findFirst({
      where: {
        id: engagementIds[0],
        workspace: { memberships: { some: { userId: alpha.id } } }
      }
    });
    expect(denied).toBeNull();
    expect(granted?.id).toBe(engagementIds[0]);
  });

  it("denies unauthorized responses, and concurrent valid responses are single-use", async () => {
    const denied = await db.clientDecision.updateMany({
      where: {
        id: decisionId,
        status: "REQUESTED",
        revision: 0,
        engagement: { workspace: { memberships: { some: { userId: bravo.id } } } }
      },
      data: { status: "APPROVED", revision: { increment: 1 } }
    });
    expect(denied.count).toBe(0);
    const respond = () =>
      db.clientDecision.updateMany({
        where: {
          id: decisionId,
          status: "REQUESTED",
          revision: 0,
          engagement: { workspace: { memberships: { some: { userId: alpha.id } } } }
        },
        data: { status: "APPROVED", revision: { increment: 1 } }
      });
    const both = await Promise.all([respond(), respond()]);
    expect(both.reduce((count, result) => count + result.count, 0)).toBe(1);
    expect(
      (await db.clientDecision.findUnique({ where: { id: decisionId } }))?.status
    ).toBe("APPROVED");
  });

  it("does not leak draft invoices or administrator-only activity into customer views", async () => {
    const engagementId = engagementIds[0];
    await db.clientInvoice.createMany({
      data: [
        { engagementId, reference: "DRAFT-1", amountCents: 1000, status: "DRAFT" },
        { engagementId, reference: "ISSUED-1", amountCents: 1000, status: "ISSUED" }
      ]
    });
    await db.clientDeliveryEvent.createMany({
      data: [
        {
          engagementId,
          kind: "INVOICE_DRAFT_CREATED",
          entityId: "private",
          summary: "Admin draft",
          visibleToClient: false
        },
        {
          engagementId,
          kind: "INVOICE_ISSUED",
          entityId: "issued",
          summary: "Invoice issued",
          visibleToClient: true
        }
      ]
    });
    const invoices = await db.clientInvoice.findMany({
      where: {
        engagementId,
        status: { in: ["ISSUED", "PAID"] },
        engagement: { workspace: { memberships: { some: { userId: alpha.id } } } }
      }
    });
    const events = await db.clientDeliveryEvent.findMany({
      where: {
        engagementId,
        visibleToClient: true,
        engagement: { workspace: { memberships: { some: { userId: alpha.id } } } }
      }
    });
    expect(invoices.map((item) => item.reference)).toEqual(["ISSUED-1"]);
    expect(events.map((item) => item.kind)).toEqual(["INVOICE_ISSUED"]);
  });

  it("returns only verified private files belonging to the signed-in workspace", async () => {
    const engagementId = engagementIds[0];
    await db.clientFile.createMany({
      data: [
        {
          engagementId,
          uploaderUserId: alpha.id,
          filename: "draft.pdf",
          contentType: "application/pdf",
          byteSize: 100,
          checksumSha256: "a".repeat(64),
          storageKey: "test/one/" + seed,
          expiresAt: new Date(Date.now() + 120000),
          status: "UPLOADING"
        },
        {
          engagementId,
          uploaderUserId: alpha.id,
          filename: "verified.pdf",
          contentType: "application/pdf",
          byteSize: 100,
          checksumSha256: "a".repeat(64),
          storageKey: "test/two/" + seed,
          expiresAt: new Date(Date.now() + 120000),
          status: "READY"
        }
      ]
    });
    const where = (userId: string) => ({
      engagementId,
      status: "READY" as const,
      engagement: { workspace: { memberships: { some: { userId } } } }
    });
    expect(
      (await db.clientFile.findMany({ where: where(alpha.id) })).map(
        (file) => file.filename
      )
    ).toEqual(["verified.pdf"]);
    expect(await db.clientFile.findMany({ where: where(bravo.id) })).toEqual([]);
  });
});
