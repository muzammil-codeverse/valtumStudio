import "server-only";

import { prisma } from "@/lib/database";

import { listingSchema } from "../shared/schemas/listing";
import { authorizeCms } from "../shared/server/action";

export async function listServices(input: unknown) {
  await authorizeCms("services", "read");
  const params = listingSchema.parse(input);
  const where = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.query
      ? {
          OR: [
            { title: { contains: params.query, mode: "insensitive" as const } },
            { slug: { contains: params.query, mode: "insensitive" as const } }
          ]
        }
      : {})
  };
  const [items, total] = await prisma.$transaction([
    prisma.serviceOffering.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        status: true,
        featured: true,
        sortOrder: true,
        updatedAt: true
      },
      orderBy: { updatedAt: params.direction },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    }),
    prisma.serviceOffering.count({ where })
  ]);
  return { items, total, params };
}
export async function getService(id: string) {
  await authorizeCms("services", "read");
  return prisma.serviceOffering.findUnique({
    where: { id },
    include: { capabilities: { orderBy: { sortOrder: "asc" } } }
  });
}
