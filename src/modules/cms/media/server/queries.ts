import "server-only";

import { prisma } from "@/lib/database";

const pageSize = 20;

export type MediaPickerItem = Readonly<{
  altText: string | null;
  filename: string;
  height: number | null;
  id: string;
  mimeType: string;
  publicUrl: string | null;
  width: number | null;
}>;

export async function findReadyMedia(
  input: Readonly<{
    page: number;
    query: string;
  }>
): Promise<Readonly<{ items: MediaPickerItem[]; page: number; total: number }>> {
  const page = Number.isSafeInteger(input.page) && input.page > 0 ? input.page : 1;
  const query = input.query.trim().slice(0, 120);
  const where = {
    status: "READY" as const,
    ...(query.length === 0
      ? {}
      : {
          OR: [
            { altText: { contains: query, mode: "insensitive" as const } },
            { caption: { contains: query, mode: "insensitive" as const } },
            { filename: { contains: query, mode: "insensitive" as const } }
          ]
        })
  };
  const [items, total] = await prisma.$transaction([
    prisma.mediaAsset.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        altText: true,
        filename: true,
        height: true,
        id: true,
        mimeType: true,
        publicUrl: true,
        width: true
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      where
    }),
    prisma.mediaAsset.count({ where })
  ]);
  return { items, page, total };
}
