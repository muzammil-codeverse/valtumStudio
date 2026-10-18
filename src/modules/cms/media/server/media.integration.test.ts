import { createHash, randomUUID } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import { parseMediaEnvironment } from "@/config/env/media";
import { prisma } from "@/lib/database";

import { finalizeMediaUpload, reserveMediaUpload } from "./media-service";
import type { MediaStorage, PresignedUpload, StoredObjectHead } from "./storage-port";

class FakeMediaStorage implements MediaStorage {
  private readonly objects = new Map<
    string,
    Readonly<{ bytes: Uint8Array; contentType: string }>
  >();

  public setObject(key: string, bytes: Uint8Array, contentType: string): void {
    this.objects.set(key, { bytes, contentType });
  }

  public async copyObject(
    input: Readonly<{
      cacheControl: string;
      contentType: string;
      destinationKey: string;
      sourceKey: string;
    }>
  ): Promise<void> {
    const source = this.requireObject(input.sourceKey);
    this.objects.set(input.destinationKey, {
      bytes: source.bytes,
      contentType: input.contentType
    });
  }

  public async createPresignedRead(): Promise<string> {
    return "https://storage.test/read";
  }

  public async createPresignedUpload(): Promise<PresignedUpload> {
    return {
      expiresAt: new Date(Date.now() + 60_000),
      headers: {},
      method: "PUT",
      url: "https://storage.test/upload"
    };
  }

  public async deleteObject(key: string): Promise<void> {
    this.objects.delete(key);
  }

  public async headObject(key: string): Promise<StoredObjectHead> {
    const object = this.requireObject(key);
    return {
      byteSize: object.bytes.byteLength,
      checksumSha256: Buffer.from(
        createHash("sha256").update(object.bytes).digest()
      ).toString("base64"),
      contentType: object.contentType
    };
  }

  public async objectExists(key: string): Promise<boolean> {
    return this.objects.has(key);
  }

  public async readObjectRange(
    input: Readonly<{
      endInclusive: number;
      key: string;
      start: number;
    }>
  ): Promise<Uint8Array> {
    return this.requireObject(input.key).bytes.slice(
      input.start,
      input.endInclusive + 1
    );
  }

  private requireObject(
    key: string
  ): Readonly<{ bytes: Uint8Array; contentType: string }> {
    const object = this.objects.get(key);
    if (!object) throw new Error("NoSuchKey");
    return object;
  }
}

const validPng = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
  0x44, 0x52, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x03
]);

const createdUserIds: string[] = [];
const createdAssetIds: string[] = [];

afterEach(async () => {
  if (createdAssetIds.length > 0 || createdUserIds.length > 0) {
    await prisma.auditEvent.deleteMany({
      where: {
        OR: [
          { actorUserId: { in: createdUserIds } },
          { entityId: { in: createdAssetIds } }
        ]
      }
    });
    await prisma.mediaAsset.deleteMany({ where: { id: { in: createdAssetIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  createdAssetIds.length = 0;
  createdUserIds.length = 0;
});

describe("media upload integration", () => {
  it("owns fixtures and finalizes a verified upload without real S3", async () => {
    const userId = randomUUID();
    const suffix = randomUUID();
    createdUserIds.push(userId);
    await prisma.user.create({
      data: {
        email: `phase7-media-${suffix}@example.test`,
        id: userId,
        name: "Phase 7 Media Operator",
        role: "admin"
      }
    });
    const parsed = parseMediaEnvironment({
      MEDIA_PUBLIC_BASE_URL: "https://cdn.example.test/assets",
      MEDIA_S3_ACCESS_KEY_ID: "test-key",
      MEDIA_S3_BUCKET: "siglum-media-test",
      MEDIA_S3_ENDPOINT: "https://storage.example.test",
      MEDIA_S3_REGION: "auto",
      MEDIA_S3_SECRET_ACCESS_KEY: "test-secret",
      MEDIA_STORAGE_ENABLED: "true"
    });
    if (!parsed.enabled) throw new Error("Expected enabled media configuration.");
    const storage = new FakeMediaStorage();
    const checksum = Buffer.from(
      createHash("sha256").update(validPng).digest()
    ).toString("base64");
    const reservation = await reserveMediaUpload(
      {
        byteSize: validPng.byteLength,
        checksumSha256: checksum,
        filename: "integration image.png",
        mimeType: "image/png",
        requestToken: randomUUID().replaceAll("-", "")
      },
      userId,
      parsed,
      storage
    );
    createdAssetIds.push(reservation.assetId);
    const pending = await prisma.mediaAsset.findUniqueOrThrow({
      where: { id: reservation.assetId }
    });
    expect(pending.incomingKey).not.toBeNull();
    if (!pending.incomingKey) throw new Error("Expected incoming object key.");
    storage.setObject(pending.incomingKey, validPng, "image/png");

    await expect(
      finalizeMediaUpload({
        actorUserId: userId,
        assetId: reservation.assetId,
        environment: parsed,
        expectedRevision: reservation.revision,
        storage
      })
    ).resolves.toEqual({ id: reservation.assetId, revision: reservation.revision + 2 });

    const finalized = await prisma.mediaAsset.findUniqueOrThrow({
      where: { id: reservation.assetId }
    });
    expect(finalized.status).toBe("READY");
    expect(finalized.storageKey).toContain("/public/media/");
    expect(finalized.incomingKey).toBeNull();
  });
});
