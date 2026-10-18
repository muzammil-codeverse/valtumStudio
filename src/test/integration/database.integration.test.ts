import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPrismaClient } from "@/lib/database/create-client";

import { seedDatabase } from "../../../prisma/seed";

function requireTestDatabaseUrl(): string {
  const connectionString = process.env["TEST_DATABASE_URL"];

  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error("TEST_DATABASE_URL must be configured for integration tests.");
  }

  return connectionString;
}

const prisma = createPrismaClient(requireTestDatabaseUrl());

describe("database integration", () => {
  beforeAll(async () => {
    await seedDatabase(requireTestDatabaseUrl());
    await seedDatabase(requireTestDatabaseUrl());
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("migrates the domain schema and seeds a deterministic dataset", async () => {
    const [serviceCount, projectCount, tagCount, leadCount, settingCount, pageCount] =
      await Promise.all([
        prisma.serviceOffering.count(),
        prisma.project.count(),
        prisma.tag.count(),
        prisma.lead.count(),
        prisma.siteSetting.count(),
        prisma.fixedPage.count()
      ]);

    expect(serviceCount).toBe(2);
    expect(projectCount).toBe(0);
    expect(tagCount).toBe(2);
    expect(leadCount).toBe(0);
    expect(settingCount).toBe(1);
    expect(pageCount).toBe(1);
  });

  it("enforces representative integrity constraints", async () => {
    await expect(
      prisma.serviceOffering.create({
        data: {
          slug: "brand-strategy",
          summary: "Duplicate slug must fail.",
          title: "Duplicate"
        }
      })
    ).rejects.toMatchObject({ code: "P2002" });

    await expect(
      prisma.fixedPage.create({ data: { key: "home", title: "Duplicate" } })
    ).rejects.toMatchObject({ code: "P2002" });

    await expect(
      prisma.redirectRule.create({
        data: { destinationPath: "/new", sourcePath: "/old", statusCode: 303 }
      })
    ).rejects.toMatchObject({ cause: { code: "23514" } });

    await expect(
      prisma.redirectRule.create({
        data: { destinationPath: "/same", sourcePath: "/same", statusCode: 308 }
      })
    ).rejects.toMatchObject({ cause: { code: "23514" } });

    await expect(
      prisma.mediaAsset.create({
        data: { byteSize: -1, filename: "invalid.png", mimeType: "image/png" }
      })
    ).rejects.toMatchObject({ cause: { code: "23514" } });

    await prisma.lead.create({
      data: {
        email: "constraint@example.test",
        idempotencyKey: "form-submission-1",
        name: "Constraint test"
      }
    });
    await expect(
      prisma.lead.create({
        data: {
          email: "another@example.test",
          idempotencyKey: "form-submission-1",
          name: "Constraint test"
        }
      })
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("enforces foreign keys and owned/shared record deletion behavior", async () => {
    await expect(
      prisma.projectEvidence.create({
        data: { label: "Invalid relation", projectId: "missing-project" }
      })
    ).rejects.toMatchObject({ code: "P2003" });

    const project = await prisma.project.create({
      data: {
        slug: "constraint-project",
        summary: "Constraint test",
        title: "Constraint test"
      }
    });
    const media = await prisma.mediaAsset.create({
      data: { byteSize: 1, filename: "proof.png", mimeType: "image/png" }
    });
    const evidence = await prisma.projectEvidence.create({
      data: { label: "Proof", mediaAssetId: media.id, projectId: project.id }
    });

    await prisma.mediaAsset.delete({ where: { id: media.id } });
    await expect(
      prisma.projectEvidence.findUniqueOrThrow({ where: { id: evidence.id } })
    ).resolves.toMatchObject({ mediaAssetId: null });

    await prisma.project.delete({ where: { id: project.id } });
    await expect(
      prisma.projectEvidence.findUnique({ where: { id: evidence.id } })
    ).resolves.toBeNull();
  });
});
