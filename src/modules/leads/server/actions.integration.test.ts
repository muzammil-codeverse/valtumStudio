import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createPrismaClient } from "@/lib/database/create-client";
import { AuthorizationError } from "@/modules/auth/policies/authorization";
import {
  AuthenticationError,
  type AuthPrincipal
} from "@/modules/auth/server/authorization";

const mocks = vi.hoisted(() => ({
  invalidateLeadContent: vi.fn(),
  requirePermission: vi.fn()
}));

function isModule(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/modules/cms/shared/server/cache", () => ({
  invalidateLeadContent: mocks.invalidateLeadContent
}));
vi.mock("@/modules/auth/server/authorization", async (importOriginal) => {
  const actual = await importOriginal();
  if (!isModule(actual)) {
    throw new Error(
      "Authorization module could not be loaded for integration testing."
    );
  }
  return { ...actual, requirePermission: mocks.requirePermission };
});

import {
  addLeadNoteAction,
  archiveLeadAction,
  assignLeadAction,
  changeLeadPriorityAction,
  changeLeadStatusAction,
  restoreLeadAction
} from "./actions";

function requireTestDatabaseUrl(): string {
  const connectionString = process.env["TEST_DATABASE_URL"];
  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error("TEST_DATABASE_URL must be configured for integration tests.");
  }
  return connectionString;
}

const prisma = createPrismaClient(requireTestDatabaseUrl());
const ownerId = randomUUID();
const adminId = randomUUID();
const editorId = randomUUID();
const principal: AuthPrincipal = {
  email: "lead-owner@example.test",
  mustChangePassword: false,
  name: "Lead Owner",
  recoveryCodesAcknowledged: true,
  role: "owner",
  sessionCreatedAt: new Date("2026-07-14T00:00:00.000Z"),
  sessionExpiresAt: new Date("2026-07-15T00:00:00.000Z"),
  sessionId: "lead-crm-session",
  twoFactorEnabled: true,
  userId: ownerId
};

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

async function clearLeadRecords(): Promise<void> {
  await prisma.leadActivity.deleteMany();
  await prisma.leadNote.deleteMany();
  await prisma.leadServiceInterestRecord.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.auditEvent.deleteMany({ where: { entityType: "Lead" } });
}

async function createLead() {
  return prisma.lead.create({
    data: {
      name: "Workflow lead",
      email: `workflow-${crypto.randomUUID()}@example.test`,
      projectType: "WEB_APPLICATION",
      projectStage: "IDEA",
      projectSummary: "A valid workflow integration lead."
    }
  });
}

describe("lead workflow actions integration", () => {
  beforeAll(async () => {
    await prisma.user.upsert({
      where: { id: ownerId },
      create: {
        id: ownerId,
        name: "Lead Owner",
        email: principal.email,
        role: "owner"
      },
      update: { banned: false, role: "owner" }
    });
    await prisma.user.upsert({
      where: { id: adminId },
      create: {
        id: adminId,
        name: "Lead Admin",
        email: "lead-admin@example.test",
        role: "admin"
      },
      update: { banned: false, role: "admin" }
    });
    await prisma.user.upsert({
      where: { id: editorId },
      create: {
        id: editorId,
        name: "Lead Editor",
        email: "lead-editor@example.test",
        role: "editor"
      },
      update: { banned: false, role: "editor" }
    });
  });

  beforeEach(async () => {
    await clearLeadRecords();
    mocks.invalidateLeadContent.mockReset();
    mocks.requirePermission.mockResolvedValue(principal);
  });

  afterAll(async () => {
    await clearLeadRecords();
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, adminId, editorId] } }
    });
    await prisma.$disconnect();
  });

  it("updates a current revision once, with atomic activity and audit records", async () => {
    const lead = await createLead();
    const result = await changeLeadStatusAction(
      form({ id: lead.id, revision: "1", status: "CONTACTED" })
    );
    expect(result.ok).toBe(true);
    const saved = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });
    expect(saved).toMatchObject({ revision: 2, status: "CONTACTED" });
    expect(await prisma.leadActivity.count({ where: { leadId: lead.id } })).toBe(1);
    expect(await prisma.auditEvent.count({ where: { entityId: lead.id } })).toBe(1);
  });

  it("rejects stale and unchanged updates without committing activity or audit records", async () => {
    const lead = await createLead();
    const stale = await changeLeadStatusAction(
      form({ id: lead.id, revision: "2", status: "CONTACTED" })
    );
    const unchanged = await changeLeadStatusAction(
      form({ id: lead.id, revision: "1", status: "NEW" })
    );
    expect(stale).toMatchObject({ code: "CONFLICT", ok: false });
    expect(unchanged).toMatchObject({ code: "INVALID_STATE", ok: false });
    expect(await prisma.leadActivity.count({ where: { leadId: lead.id } })).toBe(0);
    expect(await prisma.auditEvent.count({ where: { entityId: lead.id } })).toBe(0);
  });

  it("changes priority, assignment, notes, archival, restoration, and spam state", async () => {
    const lead = await createLead();
    expect(
      await changeLeadPriorityAction(
        form({ id: lead.id, revision: "1", priority: "HIGH" })
      )
    ).toMatchObject({ ok: true });
    expect(
      await assignLeadAction(
        form({ id: lead.id, revision: "2", assigneeUserId: ownerId })
      )
    ).toMatchObject({ ok: true });
    expect(
      await assignLeadAction(form({ id: lead.id, revision: "3", assigneeUserId: "" }))
    ).toMatchObject({ ok: true });
    expect(
      await assignLeadAction(
        form({ id: lead.id, revision: "4", assigneeUserId: ownerId })
      )
    ).toMatchObject({ ok: true });
    expect(
      await addLeadNoteAction(
        form({ id: lead.id, revision: "5", body: "Follow up this week." })
      )
    ).toMatchObject({ ok: true });
    expect(await archiveLeadAction(form({ id: lead.id, revision: "6" }))).toMatchObject(
      { ok: true }
    );
    expect(await restoreLeadAction(form({ id: lead.id, revision: "7" }))).toMatchObject(
      { ok: true }
    );
    expect(
      await changeLeadStatusAction(form({ id: lead.id, revision: "8", status: "SPAM" }))
    ).toMatchObject({ ok: true });
    const saved = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });
    expect(saved).toMatchObject({
      assigneeUserId: ownerId,
      priority: "HIGH",
      revision: 9,
      status: "SPAM"
    });
    expect(saved.spamAt).not.toBeNull();
    expect(await prisma.leadNote.count({ where: { leadId: lead.id } })).toBe(1);
    expect(await prisma.leadActivity.count({ where: { leadId: lead.id } })).toBe(8);
    expect(await prisma.auditEvent.count({ where: { entityId: lead.id } })).toBe(8);
  });

  it("accepts Better Auth UUID user IDs for eligible owner and administrator assignment", async () => {
    const lead = await createLead();
    expect(
      await assignLeadAction(
        form({ id: lead.id, revision: "1", assigneeUserId: ownerId })
      )
    ).toMatchObject({ ok: true });
    expect(
      await assignLeadAction(
        form({ id: lead.id, revision: "2", assigneeUserId: adminId })
      )
    ).toMatchObject({ ok: true });
  });

  it("rejects empty notes and inactive or unauthorized assignees", async () => {
    const lead = await createLead();
    await prisma.user.update({ where: { id: editorId }, data: { banned: true } });
    expect(
      await addLeadNoteAction(form({ id: lead.id, revision: "1", body: " " }))
    ).toMatchObject({ code: "VALIDATION_ERROR", ok: false });
    expect(
      await assignLeadAction(
        form({ id: lead.id, revision: "1", assigneeUserId: editorId })
      )
    ).toMatchObject({ code: "INVALID_STATE", ok: false });
    expect(
      await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } })
    ).toMatchObject({ revision: 1 });
  });

  it("returns safe direct-action denials without loading a lead", async () => {
    mocks.requirePermission.mockRejectedValueOnce(new AuthenticationError());
    const unauthenticated = await changeLeadStatusAction(
      form({ id: "cm123456789012345678901234", revision: "1", status: "CONTACTED" })
    );
    mocks.requirePermission.mockRejectedValueOnce(new AuthorizationError());
    const forbidden = await changeLeadStatusAction(
      form({ id: "cm123456789012345678901234", revision: "1", status: "CONTACTED" })
    );
    expect(unauthenticated).toMatchObject({ code: "UNAUTHORIZED", ok: false });
    expect(forbidden).toMatchObject({ code: "FORBIDDEN", ok: false });
    expect(JSON.stringify(forbidden)).not.toContain("cm123456789012345678901234");
  });
});
