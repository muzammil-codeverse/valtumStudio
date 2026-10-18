import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { createPrismaClient } from "@/lib/database/create-client";

import { isExpectedLeadReplayConflict, submitLead } from "./submission";

function requireTestDatabaseUrl(): string {
  const connectionString = process.env["TEST_DATABASE_URL"];
  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error("TEST_DATABASE_URL must be configured for integration tests.");
  }
  return connectionString;
}

const prisma = createPrismaClient(requireTestDatabaseUrl());

function payload(
  token: string,
  summary = "A detailed scoped lead enquiry for testing."
) {
  return {
    fullName: "Ada Lovelace",
    email: "ada@example.test",
    projectType: "WEB_APPLICATION",
    projectStage: "IDEA",
    projectSummary: summary,
    serviceInterests: ["WEB_APPLICATIONS"],
    consent: true,
    consentVersion: "test-v1",
    submissionToken: token,
    honeypot: ""
  };
}

async function clearLeadRecords(): Promise<void> {
  await prisma.leadActivity.deleteMany();
  await prisma.leadNote.deleteMany();
  await prisma.leadServiceInterestRecord.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.leadDuplicateWindow.deleteMany();
  await prisma.leadRateLimitBucket.deleteMany();
}

describe("lead submission integration", () => {
  beforeEach(clearLeadRecords);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("makes same-token replays and concurrent duplicate races create one lead", async () => {
    const timestamp = new Date("2026-07-14T10:00:00.000Z");
    const input = {
      payload: payload("same-token-123456"),
      requesterIdentifier: "127.0.0.1",
      timestamp
    };
    const concurrentResults = await Promise.allSettled([
      submitLead(input, prisma),
      submitLead(input, prisma)
    ]);
    expect(concurrentResults).toEqual([
      { status: "fulfilled", value: undefined },
      { status: "fulfilled", value: undefined }
    ]);
    await submitLead(input, prisma);
    expect(await prisma.lead.count()).toBe(1);
    expect(await prisma.leadActivity.count({ where: { type: "CREATED" } })).toBe(1);
  });

  it("allows a later or materially different enquiry without permanent email uniqueness", async () => {
    await submitLead(
      {
        payload: payload("first-token-123456"),
        requesterIdentifier: "127.0.0.1",
        timestamp: new Date("2026-07-14T10:00:00.000Z")
      },
      prisma
    );
    await submitLead(
      {
        payload: payload("second-token-12345", "A different project brief."),
        requesterIdentifier: "127.0.0.1",
        timestamp: new Date("2026-07-14T10:01:00.000Z")
      },
      prisma
    );
    await submitLead(
      {
        payload: payload("third-token-123456"),
        requesterIdentifier: "127.0.0.1",
        timestamp: new Date("2026-07-14T10:15:00.000Z")
      },
      prisma
    );
    expect(await prisma.lead.count()).toBe(3);
  });

  it("classifies only known idempotency and duplicate-window unique races as replays", () => {
    const idempotencyRace = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint",
      {
        clientVersion: "7.8.0",
        code: "P2002",
        meta: { modelName: "Lead", target: ["idempotency_key"] }
      }
    );
    const unrelatedRace = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint",
      {
        clientVersion: "7.8.0",
        code: "P2002",
        meta: { modelName: "Lead", target: ["unexpected_unique_key"] }
      }
    );
    const duplicateWindowAdapterRace = {
      code: "P2002",
      meta: {
        driverAdapterError: {
          cause: { constraint: { fields: ["fingerprint", "window_start"] } }
        },
        modelName: "LeadDuplicateWindow"
      }
    };
    expect(isExpectedLeadReplayConflict(idempotencyRace)).toBe(true);
    expect(isExpectedLeadReplayConflict(duplicateWindowAdapterRace)).toBe(true);
    expect(isExpectedLeadReplayConflict(unrelatedRace)).toBe(false);
    expect(isExpectedLeadReplayConflict(new Error("database unavailable"))).toBe(false);
  });
});
