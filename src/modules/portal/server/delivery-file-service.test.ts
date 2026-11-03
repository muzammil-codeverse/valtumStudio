import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOptionalSession: vi.fn(),
  isClientPortalEnabled: vi.fn(),
  getMediaStorage: vi.fn(),
  findProject: vi.fn(),
  findFile: vi.fn(),
  createFile: vi.fn(),
  countFiles: vi.fn()
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/database", () => ({
  prisma: {
    clientEngagement: { findFirst: mocks.findProject },
    clientFile: {
      findFirst: mocks.findFile,
      create: mocks.createFile,
      count: mocks.countFiles
    }
  }
}));
vi.mock("@/modules/auth/server/authorization", () => ({
  getOptionalSession: mocks.getOptionalSession,
  getAuthenticationAssurance: () => "FULLY_AUTHENTICATED"
}));
vi.mock("@/modules/cms/media/server/storage", () => ({
  getMediaStorage: mocks.getMediaStorage
}));
vi.mock("@/modules/portal/server/client-data", () => ({
  isClientPortalEnabled: mocks.isClientPortalEnabled
}));

import { downloadDeliveryFile, reserveDeliveryFile } from "./delivery-file-service";

const input = {
  engagementId: "engagement-001",
  filename: "review.png",
  contentType: "image/png",
  byteSize: 128,
  checksumSha256: "a".repeat(64)
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("DELIVERY_FILES_ENABLED", "true");
  vi.stubEnv("MEDIA_STORAGE_ENABLED", "true");
  vi.stubEnv("DELIVERY_CLAMAV_ENABLED", "true");
  vi.stubEnv("DELIVERY_CLAMAV_HOST", "127.0.0.1");
  vi.stubEnv("DELIVERY_CLAMAV_PORT", "3310");
  mocks.isClientPortalEnabled.mockReturnValue(true);
  mocks.getOptionalSession.mockResolvedValue({ role: "client", userId: "client-001" });
  mocks.getMediaStorage.mockReturnValue({ createPresignedUpload: vi.fn() });
  mocks.countFiles.mockResolvedValue(0);
});

describe("private customer file access", () => {
  it("rejects PDFs even when a legacy verification flag is set", async () => {
    vi.stubEnv("DELIVERY_PDF_CDR_VERIFIED", "true");
    await expect(
      reserveDeliveryFile({
        ...input,
        filename: "unsafe.pdf",
        contentType: "application/pdf"
      })
    ).rejects.toMatchObject({ status: 400 });
    expect(mocks.getMediaStorage).not.toHaveBeenCalled();
    expect(mocks.createFile).not.toHaveBeenCalled();
  });

  it("remains unavailable until the portal and storage flags are explicitly enabled", async () => {
    vi.stubEnv("DELIVERY_FILES_ENABLED", "false");
    await expect(reserveDeliveryFile(input)).rejects.toMatchObject({ status: 503 });
    expect(mocks.findProject).not.toHaveBeenCalled();
  });

  it("does not reserve an upload for a customer outside the project", async () => {
    mocks.findProject.mockResolvedValue(null);
    await expect(reserveDeliveryFile(input)).rejects.toMatchObject({ status: 404 });
    expect(mocks.createFile).not.toHaveBeenCalled();
    expect(mocks.findProject).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "engagement-001",
          workspace: { memberships: { some: { userId: "client-001" } } }
        }
      })
    );
  });

  it("never returns unverified or cross-tenant private files", async () => {
    mocks.findFile.mockResolvedValue(null);
    await expect(downloadDeliveryFile("file-record-001")).rejects.toMatchObject({
      status: 404
    });
    expect(mocks.findFile).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "file-record-001",
          status: "READY",
          scanCompletedAt: { not: null },
          engagement: {
            workspace: { memberships: { some: { userId: "client-001" } } }
          }
        }
      })
    );
  });
});
