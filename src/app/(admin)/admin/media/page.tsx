import { headers } from "next/headers";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { MediaUploader } from "@/modules/cms/media/ui/MediaUploader";
import { CmsList } from "@/modules/cms/shared/ui/CmsList";
export default async function MediaPage(): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "media", "read");
  const items = await prisma.mediaAsset.findMany({
    select: { id: true, filename: true, mimeType: true, status: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 100
  });
  return (
    <main className="space-y-6 p-6">
      <MediaUploader />
      <CmsList
        title="Media library"
        description="Verified images and their lifecycle. Pending, failed, archived, and deleted records remain visible for authorized review."
        items={items.map(({ filename, mimeType, ...item }) => ({
          ...item,
          title: filename,
          slug: mimeType
        }))}
        editBase="/admin/media"
        emptyMessage="No media assets have been registered."
      />
    </main>
  );
}
