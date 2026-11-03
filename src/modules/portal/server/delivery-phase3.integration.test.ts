import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPrismaClient } from "@/lib/database/create-client";

import { getClientBillingInsights } from "./delivery-billing";
import { inboxFilter } from "./delivery-inbox";
import { getClientInvoiceHistory } from "./delivery-invoice-history";
import { getClientDeliveryMetrics } from "./delivery-metrics";

const url = process.env["TEST_DATABASE_URL"];
if (!url) throw new Error("TEST_DATABASE_URL is required for integration.");
const db = createPrismaClient(url);
const suffix = randomUUID();
const owner = randomUUID();
const alpha = randomUUID();
const bravo = randomUUID();
const workspaceA = randomUUID();
const workspaceB = randomUUID();
const projectA = randomUUID();
const projectB = randomUUID();

beforeAll(async () => {
  for (const user of [
    { id: owner, role: "owner", name: "Studio owner" },
    { id: alpha, role: "client", name: "Customer Alpha" },
    { id: bravo, role: "client", name: "Customer Bravo" }
  ]) {
    await db.user.create({
      data: {
        id: user.id,
        role: user.role,
        name: user.name,
        emailVerified: true,
        email: user.id + "@integration.example.test"
      }
    });
  }
  await db.clientWorkspace.createMany({
    data: [
      { id: workspaceA, name: "Scoped Alpha", slug: "p3a-" + suffix },
      { id: workspaceB, name: "Scoped Bravo", slug: "p3b-" + suffix }
    ]
  });
  await db.clientEngagement.createMany({
    data: [
      { id: projectA, workspaceId: workspaceA, title: "Alpha delivery" },
      { id: projectB, workspaceId: workspaceB, title: "Bravo delivery" }
    ]
  });
  await db.clientMembership.createMany({
    data: [
      { workspaceId: workspaceA, userId: alpha },
      { workspaceId: workspaceB, userId: bravo }
    ]
  });
  await db.clientTask.createMany({
    data: [
      ...Array.from({ length: 130 }, (_, index) => ({
        engagementId: projectA,
        title: "Alpha task " + index,
        status: index < 30 ? ("DONE" as const) : ("OPEN" as const),
        sortOrder: index
      })),
      ...Array.from({ length: 50 }, (_, index) => ({
        engagementId: projectB,
        title: "Bravo task " + index,
        status: "DONE" as const,
        sortOrder: index
      }))
    ]
  });
  await db.clientMilestone.createMany({
    data: [
      ...Array.from({ length: 5 }, (_, index) => ({
        engagementId: projectA,
        title: "Alpha milestone " + index,
        status: index < 3 ? ("COMPLETE" as const) : ("PLANNED" as const),
        sortOrder: index
      })),
      { engagementId: projectB, title: "Bravo milestone", status: "COMPLETE" }
    ]
  });
  const issuedAt = new Date("2026-11-03T12:00:00Z");
  await db.clientInvoice.createMany({
    data: [
      ...Array.from({ length: 20 }, (_, index) => ({
        engagementId: projectA,
        reference: "AUD-O-" + index,
        amountCents: 1000,
        currency: "AUD",
        status: "ISSUED" as const,
        issuedAt
      })),
      ...Array.from({ length: 10 }, (_, index) => ({
        engagementId: projectA,
        reference: "AUD-P-" + index,
        amountCents: 5000,
        currency: "AUD",
        status: "PAID" as const,
        issuedAt
      })),
      ...Array.from({ length: 2 }, (_, index) => ({
        engagementId: projectA,
        reference: "USD-" + index,
        amountCents: 2000,
        currency: "USD",
        status: "ISSUED" as const,
        issuedAt
      })),
      {
        engagementId: projectB,
        reference: "SECRET-USD",
        amountCents: 900000,
        currency: "USD",
        status: "ISSUED",
        issuedAt
      },
      {
        engagementId: projectA,
        reference: "PRIVATE-DRAFT",
        amountCents: 1000000,
        currency: "AUD",
        status: "DRAFT"
      }
    ]
  });
  await db.clientDeliveryEvent.createMany({
    data: [
      {
        engagementId: projectA,
        actorUserId: owner,
        kind: "INVOICE_ISSUED",
        summary: "Alpha issued",
        entityId: randomUUID(),
        visibleToClient: true
      },
      {
        engagementId: projectA,
        actorUserId: owner,
        kind: "INVOICE_DRAFT_CREATED",
        summary: "Secret private draft",
        entityId: randomUUID(),
        visibleToClient: false
      },
      {
        engagementId: projectB,
        actorUserId: owner,
        kind: "INVOICE_ISSUED",
        summary: "Bravo issued",
        entityId: randomUUID(),
        visibleToClient: true
      }
    ]
  });
});

afterAll(async () => {
  await db.clientWorkspace.deleteMany({
    where: { id: { in: [workspaceA, workspaceB] } }
  });
  await db.user.deleteMany({ where: { id: { in: [owner, alpha, bravo] } } });
  await db.$disconnect();
});

describe("Phase 3 complete-data and tenant isolation", () => {
  it("counts all 130 authorized tasks, not the first 100 visible list rows", async () => {
    const a = await getClientDeliveryMetrics(alpha, new Date("2026-11-03T12:00:00Z"));
    const b = await getClientDeliveryMetrics(bravo, new Date("2026-11-03T12:00:00Z"));
    expect(a.taskTotal).toBe(130);
    expect(a.tasksDone).toBe(30);
    expect(a.taskPercent).toBe(23);
    expect(a.milestoneTotal).toBe(5);
    expect(a.milestonesDone).toBe(3);
    expect(a.projects[0]?.taskCount).toBe(130);
    expect(b.taskTotal).toBe(50);
    expect(b.taskPercent).toBe(100);
  });

  it("aggregates all invoices by currency, excluding drafts and other customers", async () => {
    const a = await getClientBillingInsights(alpha, new Date("2026-11-03T12:00:00Z"));
    expect(a.map((item) => item.currency)).toEqual(["AUD", "USD"]);
    const aud = a.find((item) => item.currency === "AUD");
    expect(aud?.invoiceCount).toBe(30);
    expect(aud?.totalCents).toBe(70000);
    expect(aud?.paidCents).toBe(50000);
    expect(aud?.outstandingCents).toBe(20000);
    expect(aud?.monthly.at(-1)?.cents).toBe(70000);
    expect(a.find((item) => item.currency === "USD")?.totalCents).toBe(4000);
  });

  it("uses cursor pagination for all 32 issued customer invoices", async () => {
    const first = await getClientInvoiceHistory(alpha);
    expect(first.invoices).toHaveLength(24);
    expect(first.nextCursor).not.toBeNull();
    const second = await getClientInvoiceHistory(alpha, first.nextCursor ?? undefined);
    expect(second.invoices).toHaveLength(8);
    expect(second.nextCursor).toBeNull();
    const all = [...first.invoices, ...second.invoices];
    expect(new Set(all.map((invoice) => invoice.id)).size).toBe(32);
    expect(all.some((invoice) => invoice.reference === "PRIVATE-DRAFT")).toBe(false);
    expect(all.some((invoice) => invoice.reference === "SECRET-USD")).toBe(false);
    await expect(
      getClientInvoiceHistory(bravo, first.nextCursor ?? undefined)
    ).rejects.toThrow();
  });

  it("excludes private activity and other customers' events from inbox queries", async () => {
    const events = await db.clientDeliveryEvent.findMany({
      where: inboxFilter(alpha, true),
      select: { summary: true }
    });
    expect(events.map((row) => row.summary)).toEqual(["Alpha issued"]);
  });
});
