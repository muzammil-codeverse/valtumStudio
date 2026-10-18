import { headers } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";

import { parseMediaEnvironment } from "@/config/env/media";
import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { getMediaUsage } from "@/modules/cms/media/server/media-service";
import { getMediaStorage } from "@/modules/cms/media/server/storage";
import { MediaDetailsForm } from "@/modules/cms/media/ui/MediaDetailsForm";

export default async function MediaAssetPage({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const principal = await requirePermission(await headers(), "media", "read");
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: (await params).id }
  });
  if (!asset) notFound();
  const usage = await getMediaUsage(asset.id);
  const usageCount = Object.values(usage).reduce((total, count) => total + count, 0);
  let previewUrl = asset.publicUrl;
  const mediaEnvironment = parseMediaEnvironment(process.env);
  if (
    previewUrl === null &&
    mediaEnvironment.enabled &&
    asset.storageKey !== null &&
    (asset.status === "READY" || asset.status === "ARCHIVED")
  ) {
    try {
      const storage = getMediaStorage();
      if (storage) {
        previewUrl = await storage.createPresignedRead({
          expiresInSeconds: mediaEnvironment.MEDIA_READ_URL_TTL_SECONDS,
          key: asset.storageKey
        });
      }
    } catch {
      previewUrl = null;
    }
  }

  return (
    <main className="max-w-2xl p-6">
      <h1 className="text-2xl font-bold">{asset.filename}</h1>
      {previewUrl && (asset.status === "READY" || asset.status === "ARCHIVED") ? (
        <Image
          alt={asset.altText ?? ""}
          className="mt-4 max-h-80 rounded object-contain"
          height={asset.height ?? 320}
          sizes="(max-width: 768px) 100vw, 672px"
          src={previewUrl}
          width={asset.width ?? 672}
        />
      ) : null}
      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-[var(--admin-text-muted)]">MIME type</dt>
          <dd>{asset.mimeType}</dd>
        </div>
        <div>
          <dt className="text-[var(--admin-text-muted)]">Size</dt>
          <dd>{asset.byteSize.toLocaleString()} bytes</dd>
        </div>
        <div>
          <dt className="text-[var(--admin-text-muted)]">Status</dt>
          <dd>{asset.status}</dd>
        </div>
        <div>
          <dt className="text-[var(--admin-text-muted)]">Dimensions</dt>
          <dd>
            {asset.width && asset.height
              ? `${asset.width} × ${asset.height}`
              : "Not verified"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--admin-text-muted)]">Checksum</dt>
          <dd>{asset.checksum ? `${asset.checksum.slice(0, 12)}…` : "Not verified"}</dd>
        </div>
        <div>
          <dt className="text-[var(--admin-text-muted)]">Usage locations</dt>
          <dd>{usageCount}</dd>
        </div>
        {asset.failureCode ? (
          <div>
            <dt className="text-[var(--admin-text-muted)]">Failure</dt>
            <dd>{asset.failureCode}</dd>
          </div>
        ) : null}
      </dl>
      <MediaDetailsForm
        altText={asset.altText}
        assetId={asset.id}
        canDelete={principal.role !== "editor"}
        caption={asset.caption}
        credit={asset.credit}
        revision={asset.revision}
        status={asset.status}
      />
    </main>
  );
}
