import { fileURLToPath } from "node:url";

import { PublicationStatus } from "../src/generated/prisma/client";
import { createPrismaClient } from "../src/lib/database/create-client";

function requireConnectionString(value: string | undefined): string {
  if (value === undefined || value.length === 0) {
    throw new Error("DIRECT_URL or DATABASE_URL must be configured before seeding.");
  }

  return value;
}

export async function seedDatabase(
  connectionString: string | undefined = process.env["DIRECT_URL"] ??
    process.env["DATABASE_URL"]
): Promise<void> {
  const prisma = createPrismaClient(requireConnectionString(connectionString));

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.serviceOffering.upsert({
        create: {
          description:
            "Positioning, narrative, and practical systems for ambitious teams.",
          slug: "brand-strategy",
          sortOrder: 10,
          status: PublicationStatus.PUBLISHED,
          summary: "Clarify the signal your organisation sends.",
          title: "Brand strategy"
        },
        update: {
          description:
            "Positioning, narrative, and practical systems for ambitious teams.",
          sortOrder: 10,
          status: PublicationStatus.PUBLISHED,
          summary: "Clarify the signal your organisation sends.",
          title: "Brand strategy"
        },
        where: { slug: "brand-strategy" }
      });

      await transaction.serviceOffering.upsert({
        create: {
          description:
            "Digital products and platforms built for durable operational change.",
          slug: "platform-engineering",
          sortOrder: 20,
          status: PublicationStatus.PUBLISHED,
          summary: "Build digital foundations that keep pace with the business.",
          title: "Platform engineering"
        },
        update: {
          description:
            "Digital products and platforms built for durable operational change.",
          sortOrder: 20,
          status: PublicationStatus.PUBLISHED,
          summary: "Build digital foundations that keep pace with the business.",
          title: "Platform engineering"
        },
        where: { slug: "platform-engineering" }
      });

      await transaction.tag.upsert({
        create: { name: "Technology", slug: "technology" },
        update: { name: "Technology" },
        where: { slug: "technology" }
      });

      await transaction.tag.upsert({
        create: { name: "Transformation", slug: "transformation" },
        update: { name: "Transformation" },
        where: { slug: "transformation" }
      });

      await transaction.siteSetting.upsert({
        create: { key: "site.identity", value: { siteName: "Valtum Studio" } },
        update: { value: { name: "Siglum Studio" } },
        where: { key: "site.identity" }
      });

      await transaction.fixedPage.upsert({
        create: { key: "home", title: "Home" },
        update: { title: "Home" },
        where: { key: "home" }
      });
    });
  } finally {
    await prisma.$disconnect();
  }
}

const currentModulePath = fileURLToPath(import.meta.url);

if (process.argv[1] === currentModulePath) {
  seedDatabase().catch((error: unknown) => {
    console.error("Database seed failed.", error);
    process.exitCode = 1;
  });
}
