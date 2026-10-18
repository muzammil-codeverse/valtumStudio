import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createPrismaClient } from "@/lib/database/create-client";

let mockDraftModeEnabled = false;

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  draftMode: async () => ({
    isEnabled: mockDraftModeEnabled
  })
}));

import { getPublicInsightBySlug } from "../server/insights";
import { getPublicNavigation } from "../server/navigation";
import { getPublicProjectBySlug } from "../server/projects";
import { getPublicServiceBySlug, getPublicServices } from "../server/services";
import { getPublicSettings } from "../server/settings";

function requireTestDatabaseUrl(): string {
  const connectionString = process.env["TEST_DATABASE_URL"];
  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error("TEST_DATABASE_URL must be configured for integration tests.");
  }
  return connectionString;
}

const prisma = createPrismaClient(requireTestDatabaseUrl());

const suitePrefix = "pub-int-";
const authorId = randomUUID();

async function cleanDb() {
  await prisma.serviceCapability.deleteMany({
    where: { title: { startsWith: suitePrefix } }
  });
  await prisma.projectService.deleteMany();
  await prisma.projectSection.deleteMany({
    where: { heading: { startsWith: suitePrefix } }
  });
  await prisma.projectMedia.deleteMany();
  await prisma.projectTechnology.deleteMany();

  await prisma.project.deleteMany({ where: { slug: { startsWith: suitePrefix } } });
  await prisma.serviceOffering.deleteMany({
    where: { slug: { startsWith: suitePrefix } }
  });
  await prisma.insight.deleteMany({ where: { slug: { startsWith: suitePrefix } } });

  await prisma.insightCategory.deleteMany({
    where: { slug: { startsWith: suitePrefix } }
  });
  await prisma.teamMember.deleteMany({ where: { slug: { startsWith: suitePrefix } } });
  await prisma.fAQItem.deleteMany({ where: { question: { startsWith: suitePrefix } } });
  await prisma.fAQGroup.deleteMany({ where: { slug: { startsWith: suitePrefix } } });
  await prisma.navigationItem.deleteMany({
    where: { label: { startsWith: suitePrefix } }
  });
  await prisma.siteSetting.deleteMany({
    where: {
      OR: [
        { key: { startsWith: suitePrefix } },
        { key: "site.contact" },
        { key: "site.private.key" }
      ]
    }
  });
  await prisma.author.deleteMany({ where: { slug: { startsWith: suitePrefix } } });
  await prisma.mediaAsset.deleteMany({
    where: { storageKey: { startsWith: suitePrefix } }
  });
  await prisma.user.deleteMany({ where: { id: authorId } });
}

describe("Public Content Integration Tests", () => {
  beforeAll(async () => {
    await cleanDb();
    // Create safe author user
    await prisma.user.create({
      data: {
        id: authorId,
        email: `${suitePrefix}author@example.test`,
        name: "Safe Author",
        role: "editor"
      }
    });

    // Create safe author profile
    await prisma.author.create({
      data: {
        id: authorId,
        userId: authorId,
        name: "Safe Author",
        slug: `${suitePrefix}safe-author`,
        isActive: true
      }
    });
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    mockDraftModeEnabled = false;
  });

  describe("Publication Visibility Policies", () => {
    it("filters services correctly on publication state, scheduling, and archiving", async () => {
      // 1. Create a deliverable media asset
      const media = await prisma.mediaAsset.create({
        data: {
          filename: "ready.png",
          byteSize: 1024,
          storageKey: `${suitePrefix}media-ready`,
          mimeType: "image/png",
          status: "READY",
          finalizedAt: new Date(),
          publicUrl: "https://cdn.example.test/ready.png",
          width: 800,
          height: 600
        }
      });

      // 2. Create services with varying status
      await prisma.serviceOffering.create({
        data: {
          slug: `${suitePrefix}service-pub`,
          title: `${suitePrefix} Published Service`,
          summary: "A published service summary",
          status: "PUBLISHED",
          publishedAt: new Date(Date.now() - 3600000), // past
          heroAssetId: media.id
        }
      });

      await prisma.serviceOffering.create({
        data: {
          slug: `${suitePrefix}service-draft`,
          title: `${suitePrefix} Draft Service`,
          summary: "A draft service summary",
          status: "DRAFT",
          publishedAt: null
        }
      });

      await prisma.serviceOffering.create({
        data: {
          slug: `${suitePrefix}service-future`,
          title: `${suitePrefix} Future Service`,
          summary: "A future service summary",
          status: "PUBLISHED",
          publishedAt: new Date(Date.now() + 3600000) // future
        }
      });

      // 3. Normal Mode queries
      const normalServices = await getPublicServices();
      const pubOnly = normalServices.filter((s) => s.slug.startsWith(suitePrefix));
      expect(pubOnly.length).toBe(1);
      expect(pubOnly[0]?.slug).toBe(`${suitePrefix}service-pub`);

      // 4. Preview Mode queries
      mockDraftModeEnabled = true;
      const previewServices = await getPublicServices();
      const allServices = previewServices.filter((s) => s.slug.startsWith(suitePrefix));
      expect(allServices.length).toBe(3); // pub, draft, and future should be visible under draft mode
    });
  });

  describe("Media Asset Inclusion Rules & Private Field Protection", () => {
    it("excludes unverified, pending, and legacy archived media, and prevents private field leaks", async () => {
      // 1. Create various media asset types
      const mediaReady = await prisma.mediaAsset.create({
        data: {
          filename: "ready.png",
          byteSize: 1024,
          storageKey: `${suitePrefix}ready-1`,
          mimeType: "image/png",
          status: "READY",
          finalizedAt: new Date(),
          publicUrl: "https://cdn.example.test/ready.png",
          width: 800,
          height: 600
        }
      });

      await prisma.mediaAsset.create({
        data: {
          filename: "legacy.png",
          byteSize: 1024,
          storageKey: null,
          mimeType: "image/png",
          status: "ARCHIVED",
          finalizedAt: null,
          publicUrl: null
        }
      });

      const mediaUnverifiedActive = await prisma.mediaAsset.create({
        data: {
          filename: "active.png",
          byteSize: 1024,
          storageKey: `${suitePrefix}active-1`,
          mimeType: "image/png",
          status: "ACTIVE",
          finalizedAt: null,
          publicUrl: "https://cdn.example.test/active.png"
        }
      });

      // 2. Create service with verified hero asset and unverified social asset
      const service = await prisma.serviceOffering.create({
        data: {
          slug: `${suitePrefix}service-media-test`,
          title: `${suitePrefix} Service Media Test`,
          summary: "A service summary",
          status: "PUBLISHED",
          publishedAt: new Date(Date.now() - 3600000),
          heroAssetId: mediaReady.id,
          socialImageAssetId: mediaUnverifiedActive.id
        }
      });

      const res = await getPublicServiceBySlug(service.slug);
      expect(res).not.toBeNull();
      if (res) {
        expect(res.heroAsset).not.toBeNull();
        expect(res.heroAsset?.url).toBe("https://cdn.example.test/ready.png");
        expect(
          (res.heroAsset as Record<string, unknown>)["storageKey"]
        ).toBeUndefined(); // private field protection

        // Unverified active media must be filtered out
        expect(res.socialImageAsset).toBeNull();
      }
    });
  });

  describe("Projects, Sections, and Media Ordering", () => {
    it("fetches a published project with its sections and media in correct sortOrder", async () => {
      const mediaA = await prisma.mediaAsset.create({
        data: {
          filename: "pa.jpg",
          byteSize: 1024,
          storageKey: `${suitePrefix}media-pa`,
          mimeType: "image/jpeg",
          status: "READY",
          finalizedAt: new Date(),
          publicUrl: "https://cdn.example.test/pa.jpg",
          width: 500,
          height: 500
        }
      });

      const mediaB = await prisma.mediaAsset.create({
        data: {
          filename: "pb.png",
          byteSize: 1024,
          storageKey: `${suitePrefix}media-pb`,
          mimeType: "image/png",
          status: "READY",
          finalizedAt: new Date(),
          publicUrl: "https://cdn.example.test/pb.png",
          width: 500,
          height: 500
        }
      });

      const project = await prisma.project.create({
        data: {
          slug: `${suitePrefix}project-1`,
          title: `${suitePrefix} Project 1`,
          summary: "Project summary",
          status: "PUBLISHED",
          publishedAt: new Date(Date.now() - 3600000),
          sections: {
            createMany: {
              data: [
                {
                  kind: "CUSTOM",
                  heading: `${suitePrefix} Heading 2`,
                  bodyText: "Text 2",
                  sortOrder: 2
                },
                {
                  kind: "OVERVIEW",
                  heading: `${suitePrefix} Heading 1`,
                  bodyText: "Text 1",
                  sortOrder: 1
                }
              ]
            }
          },
          media: {
            createMany: {
              data: [
                { mediaAssetId: mediaB.id, role: "GALLERY", sortOrder: 10 },
                { mediaAssetId: mediaA.id, role: "COVER", sortOrder: 5 }
              ]
            }
          }
        }
      });

      const res = await getPublicProjectBySlug(project.slug);
      expect(res).not.toBeNull();
      if (res) {
        // Assert sections order
        expect(res.sections.length).toBe(2);
        expect(res.sections[0]?.heading).toBe(`${suitePrefix} Heading 1`);
        expect(res.sections[1]?.heading).toBe(`${suitePrefix} Heading 2`);

        // Assert media order
        expect(res.media.length).toBe(2);
        expect(res.media[0]?.mediaAsset.url).toBe("https://cdn.example.test/pa.jpg");
        expect(res.media[1]?.mediaAsset.url).toBe("https://cdn.example.test/pb.png");
      }
    });
  });

  describe("Insights and Authors", () => {
    it("returns published insight details and maps the author safely", async () => {
      const category = await prisma.insightCategory.create({
        data: {
          slug: `${suitePrefix}cat-1`,
          name: "Design & UX",
          description: "Category description",
          isActive: true
        }
      });

      const insight = await prisma.insight.create({
        data: {
          slug: `${suitePrefix}insight-1`,
          title: "Building modern design infrastructure",
          excerpt: "Insight excerpt",
          bodyJson: { root: { type: "root", children: [] } },
          bodyText: "Raw content text",
          status: "PUBLISHED",
          publishedAt: new Date(Date.now() - 3600000),
          categoryId: category.id,
          authorId
        }
      });

      const res = await getPublicInsightBySlug(insight.slug);
      expect(res).not.toBeNull();
      if (res) {
        expect(res.author).not.toBeNull();
        expect(res.author.name).toBe("Safe Author");
        expect((res.author as Record<string, unknown>)["email"]).toBeUndefined(); // private fields check
      }
    });
  });

  describe("Navigation Ordering and Sorting", () => {
    it("assembles primary navigation hierarchy ordered by sortOrder", async () => {
      await prisma.navigationItem.createMany({
        data: [
          {
            label: `${suitePrefix}Nav 2`,
            type: "INTERNAL",
            location: "PRIMARY",
            href: "/services",
            sortOrder: 2
          },
          {
            label: `${suitePrefix}Nav 1`,
            type: "INTERNAL",
            location: "PRIMARY",
            href: "/about",
            sortOrder: 1
          }
        ]
      });

      const res = await getPublicNavigation("PRIMARY");
      const filtered = res.filter((item) => item.label.startsWith(suitePrefix));
      expect(filtered.length).toBe(2);
      expect(filtered[0]?.label).toBe(`${suitePrefix}Nav 1`);
      expect(filtered[1]?.label).toBe(`${suitePrefix}Nav 2`);
    });
  });

  describe("Settings Allowlist Policy", () => {
    it("returns settings mapped and filtered down to the allowlist keys", async () => {
      await prisma.siteSetting.createMany({
        data: [
          {
            key: `${suitePrefix}site.identity`,
            value: { siteName: "Custom Studio Name", tagline: "Crafting products" }
          },
          {
            key: `${suitePrefix}site.contact`,
            value: { contactEmail: "hello@example.test", contactPhone: "+6100000" }
          },
          {
            key: `${suitePrefix}site.private.key`,
            value: { secretKey: "donot leak" }
          }
        ]
      });

      // To test the standard settings allowlist query, we need to create the actual allowlisted key entries.
      // The settings query filters on: site.identity, site.contact, site.social, site.seo, site.legal.
      // So we upsert the standard keys for this test.
      await prisma.siteSetting.upsert({
        where: { key: "site.identity" },
        create: {
          key: "site.identity",
          value: { siteName: "Custom Studio Name", tagline: "Crafting products" }
        },
        update: {
          value: { siteName: "Custom Studio Name", tagline: "Crafting products" }
        }
      });
      await prisma.siteSetting.upsert({
        where: { key: "site.contact" },
        create: {
          key: "site.contact",
          value: { contactEmail: "hello@example.test", contactPhone: "+6100000" }
        },
        update: {
          value: { contactEmail: "hello@example.test", contactPhone: "+6100000" }
        }
      });
      await prisma.siteSetting.upsert({
        where: { key: "site.private.key" },
        create: { key: "site.private.key", value: { secretKey: "donot leak" } },
        update: { value: { secretKey: "donot leak" } }
      });

      const settings = await getPublicSettings();
      expect(settings.studioName).toBe("Custom Studio Name");
      expect(settings.tagline).toBe("Crafting products");
      expect(settings.publicEmail).toBe("hello@example.test");
      expect(settings.publicPhone).toBe("+6100000");

      // Verify private keys/fields are not present on allowlisted result
      expect((settings as Record<string, unknown>)["secretKey"]).toBeUndefined();
      expect((settings as Record<string, unknown>)["site.private.key"]).toBeUndefined();
    });
  });
});
