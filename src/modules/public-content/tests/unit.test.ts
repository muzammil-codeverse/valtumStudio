import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

type UnstableCacheTestMock = (
  callback: (...args: never[]) => unknown,
  keyParts?: string[],
  options?: Readonly<{
    tags?: string[];
    revalidate?: number | false;
  }>
) => (...args: never[]) => unknown;

const mockUnstableCache = vi.fn<UnstableCacheTestMock>((fn) => {
  return fn;
});
const mockRevalidateTag = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  unstable_cache: mockUnstableCache,
  revalidateTag: mockRevalidateTag,
  revalidatePath: mockRevalidatePath
}));

const mockDraftMode = vi.fn().mockResolvedValue({ isEnabled: false });
vi.mock("next/headers", () => ({
  draftMode: mockDraftMode
}));

const mockLogger = {
  warn: vi.fn(),
  error: vi.fn()
};
vi.mock("@/lib/logging", () => ({
  logger: mockLogger
}));

vi.mock("@/lib/database", () => ({
  prisma: {
    insight: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({ categoryId: "cat-1" })
    },
    serviceOffering: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue({ slug: "slug" })
    },
    project: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue({ services: [], technologies: [] })
    },
    teamMember: {
      findMany: vi.fn().mockResolvedValue([])
    },
    siteSetting: {
      findMany: vi.fn().mockResolvedValue([])
    },
    fAQGroup: {
      findMany: vi.fn().mockResolvedValue([])
    }
  }
}));

vi.mock("server-only", () => ({}));

import { validateRichTextDocument } from "@/modules/cms/shared/domain/rich-text";

import { isPubliclyDeliverableMedia, mapPublicMedia } from "../domain/media";
import { buildServiceMetadata } from "../domain/metadata";
import { isSafeNavigationHref } from "../domain/navigation";
import { isPubliclyPublished } from "../domain/publication";
import {
  isSafeRedirectPath,
  resolveRedirect,
  validateRedirectEntry
} from "../domain/redirects";
import {
  generateCanonicalUrl,
  getTrustedBaseUrl,
  publicRoutes
} from "../domain/routes";
import {
  buildArticleJsonLd,
  buildBreadcrumbListJsonLd,
  buildFAQPageJsonLd,
  buildOrganizationJsonLd,
  serializeJsonLd
} from "../domain/structured-data";

describe("Phase 8 - Public Content Domain Unit Tests", () => {
  describe("Publication Visibility Policy", () => {
    const now = new Date("2026-07-15T12:00:00Z");

    it("allows a published record with a valid slug and past publication date", () => {
      const record = {
        status: "PUBLISHED" as const,
        publishedAt: new Date("2026-07-15T11:00:00Z"),
        archivedAt: null,
        slug: "valid-slug"
      };
      expect(isPubliclyPublished(record, now)).toBe(true);
    });

    it("allows a published record exactly at the current clock time", () => {
      const record = {
        status: "PUBLISHED" as const,
        publishedAt: now,
        archivedAt: null,
        slug: "valid-slug"
      };
      expect(isPubliclyPublished(record, now)).toBe(true);
    });

    it("rejects draft records", () => {
      const record = {
        status: "DRAFT" as const,
        publishedAt: new Date("2026-07-15T11:00:00Z"),
        archivedAt: null,
        slug: "valid-slug"
      };
      expect(isPubliclyPublished(record, now)).toBe(false);
    });

    it("rejects future scheduled publication dates", () => {
      const record = {
        status: "PUBLISHED" as const,
        publishedAt: new Date("2026-07-15T13:00:00Z"),
        archivedAt: null,
        slug: "valid-slug"
      };
      expect(isPubliclyPublished(record, now)).toBe(false);
    });

    it("rejects archived records", () => {
      const record = {
        status: "PUBLISHED" as const,
        publishedAt: new Date("2026-07-15T11:00:00Z"),
        archivedAt: new Date("2026-07-15T11:30:00Z"),
        slug: "valid-slug"
      };
      expect(isPubliclyPublished(record, now)).toBe(false);
    });

    it("rejects records with missing publishedAt", () => {
      const record = {
        status: "PUBLISHED" as const,
        publishedAt: null,
        archivedAt: null,
        slug: "valid-slug"
      };
      expect(isPubliclyPublished(record, now)).toBe(false);
    });

    it("rejects records with invalid or reserved slugs", () => {
      const record = {
        status: "PUBLISHED" as const,
        publishedAt: new Date("2026-07-15T11:00:00Z"),
        archivedAt: null,
        slug: "admin"
      };
      expect(isPubliclyPublished(record, now)).toBe(false);
    });
  });

  describe("Media Delivery Policy", () => {
    it("allows READY media with all required fields", () => {
      const media = {
        status: "READY" as const,
        storageKey: "siglum/image.png",
        mimeType: "image/png",
        finalizedAt: new Date(),
        publicUrl: "https://cdn.siglum.studio/image.png",
        width: 800,
        height: 600,
        altText: "alt",
        caption: null,
        credit: null
      };
      expect(isPubliclyDeliverableMedia(media)).toBe(true);
    });

    it("allows ARCHIVED media if it was previously verified (has all verified fields)", () => {
      const media = {
        status: "ARCHIVED" as const,
        storageKey: "siglum/image.png",
        mimeType: "image/png",
        finalizedAt: new Date(),
        publicUrl: "https://cdn.siglum.studio/image.png",
        width: 800,
        height: 600,
        altText: "alt",
        caption: null,
        credit: null
      };
      expect(isPubliclyDeliverableMedia(media)).toBe(true);
    });

    it("rejects legacy unverified ARCHIVED media", () => {
      const media = {
        status: "ARCHIVED" as const,
        storageKey: null,
        mimeType: "image/png",
        finalizedAt: null,
        publicUrl: null,
        width: null,
        height: null,
        altText: null,
        caption: null,
        credit: null
      };
      expect(isPubliclyDeliverableMedia(media)).toBe(false);
    });

    it("rejects PENDING_UPLOAD, VERIFYING, FAILED, and DELETED statuses", () => {
      const statuses = ["PENDING_UPLOAD", "VERIFYING", "FAILED", "DELETED"] as const;
      for (const status of statuses) {
        const media = {
          status,
          storageKey: "key",
          mimeType: "image/png",
          finalizedAt: new Date(),
          publicUrl: "https://cdn.siglum.studio/img.png",
          width: 100,
          height: 100,
          altText: null,
          caption: null,
          credit: null
        };
        expect(isPubliclyDeliverableMedia(media)).toBe(false);
      }
    });

    it("rejects images with invalid or missing dimensions", () => {
      const media = {
        status: "READY" as const,
        storageKey: "key",
        mimeType: "image/png",
        finalizedAt: new Date(),
        publicUrl: "https://cdn.siglum.studio/img.png",
        width: 0,
        height: -100,
        altText: null,
        caption: null,
        credit: null
      };
      expect(isPubliclyDeliverableMedia(media)).toBe(false);
    });

    it("maps media DTO correctly and strips private fields (like storageKey)", () => {
      const media = {
        status: "READY" as const,
        storageKey: "secret-s3-key-should-not-leak",
        mimeType: "image/png",
        finalizedAt: new Date(),
        publicUrl: "https://cdn.siglum.studio/img.png",
        width: 800,
        height: 600,
        altText: "alt",
        caption: "caption",
        credit: "credit"
      };
      const dto = mapPublicMedia(media);
      expect(dto).not.toBeNull();
      if (dto) {
        expect(dto.url).toBe("https://cdn.siglum.studio/img.png");
        expect(dto.width).toBe(800);
        expect("storageKey" in dto).toBe(false);
      }
    });
  });

  describe("Routing and Canonical URL Generation", () => {
    it("safely generates route paths and encodes segments", () => {
      expect(publicRoutes.service("brand-strategy")).toBe("/services/brand-strategy");
      expect(publicRoutes.project("siglum-v1")).toBe("/work/siglum-v1");
      expect(() => publicRoutes.service("../traversal")).toThrow();
    });

    it("preserves base path and strips query params in canonical URL builder", () => {
      const baseUrl = "https://siglum.studio/subfolder/";
      const result = generateCanonicalUrl(
        "/services/brand-strategy?test=1#hash",
        baseUrl
      );
      expect(result).toBe("https://siglum.studio/subfolder/services/brand-strategy");
    });

    it("prevents host overrides and handles double slashes", () => {
      const baseUrl = "https://siglum.studio";
      const result = generateCanonicalUrl("///work//project-a", baseUrl);
      expect(result).toBe("https://siglum.studio/work/project-a");
    });
  });

  describe("Redirect Validation & Resolution", () => {
    it("resolves a valid internal redirect", () => {
      const registry = [
        { sourcePath: "/old-path", destinationPath: "/new-path", permanent: true }
      ];
      const result = resolveRedirect("/old-path", registry);
      expect(result).toEqual({ destinationPath: "/new-path", permanent: true });
    });

    it("rejects loops and returns null", () => {
      const registry = [
        { sourcePath: "/path-a", destinationPath: "/path-b", permanent: true },
        { sourcePath: "/path-b", destinationPath: "/path-a", permanent: true }
      ];
      expect(resolveRedirect("/path-a", registry)).toBeNull();
    });

    it("rejects chains and returns null", () => {
      const registry = [
        { sourcePath: "/path-a", destinationPath: "/path-b", permanent: true },
        { sourcePath: "/path-b", destinationPath: "/path-c", permanent: true }
      ];
      expect(resolveRedirect("/path-a", registry)).toBeNull();
    });

    it("rejects external redirects and traversal", () => {
      expect(
        validateRedirectEntry({
          sourcePath: "/old",
          destinationPath: "https://external.com",
          permanent: true
        })
      ).toMatchObject({ ok: false });

      expect(
        validateRedirectEntry({
          sourcePath: "/old",
          destinationPath: "/new/../traversal",
          permanent: true
        })
      ).toMatchObject({ ok: false });
    });
  });

  describe("Metadata Fallbacks", () => {
    it("respects SEO title fallback hierarchy", () => {
      const service = {
        title: "Public Title",
        summary: "Summary text",
        slug: "test-slug",
        seoTitle: "SEO Title override"
      };
      const meta = buildServiceMetadata(service);
      expect(meta).not.toBeNull();
      if (meta) {
        expect(meta.title).toBe("SEO Title override");
      }
    });

    it("respects public title fallback when SEO title is missing", () => {
      const service = {
        title: "Public Title",
        summary: "Summary text",
        slug: "test-slug",
        seoTitle: null
      };
      const meta = buildServiceMetadata(service);
      expect(meta).not.toBeNull();
      if (meta) {
        expect(meta.title).toBe("Public Title");
      }
    });
  });

  describe("Structured Data & Escaping", () => {
    it("escapes < character in JSON-LD serialization to prevent script injection", () => {
      const payload = { html: "<div>test</div>", value: "<script>alert(1)</script>" };
      const serialized = serializeJsonLd(payload);
      expect(serialized).not.toContain("<div");
      expect(serialized).not.toContain("<script");
      expect(serialized).toContain("\\u003cdiv");
      expect(serialized).toContain("\\u003cscript");
    });

    it("builds FAQ structured data from active items", () => {
      const group = {
        title: "FAQ Group",
        slug: "faq-group",
        description: "description",
        items: [
          {
            question: "Q1",
            answerJson: { root: { type: "root" as const, children: [] } },
            answerText: "A1"
          },
          {
            question: "Q2",
            answerJson: { root: { type: "root" as const, children: [] } },
            answerText: "A2"
          }
        ]
      };
      const jsonLd = buildFAQPageJsonLd(group);
      expect(jsonLd["@type"]).toBe("FAQPage");
      expect(jsonLd.mainEntity.length).toBe(2);
      const firstEntity = jsonLd.mainEntity[0];
      expect(firstEntity).toBeDefined();
      if (firstEntity) {
        expect(firstEntity.name).toBe("Q1");
      }
    });
  });

  describe("Navigation Link Safety", () => {
    it("rejects unsafe protocols and admin paths", () => {
      expect(isSafeNavigationHref("javascript:alert(1)", "EXTERNAL")).toBe(false);
      expect(isSafeNavigationHref("/admin/settings", "INTERNAL")).toBe(false);
      expect(isSafeNavigationHref("/api/health", "INTERNAL")).toBe(false);
      expect(isSafeNavigationHref("https://siglum.studio", "EXTERNAL")).toBe(true);
      expect(isSafeNavigationHref("mailto:hello@siglum.studio", "EXTERNAL")).toBe(true);
      expect(isSafeNavigationHref("/services", "INTERNAL")).toBe(true);
    });
  });

  describe("Phase 8 Repairs and Missing Requirements", () => {
    describe("Cache identity and options", () => {
      it("proves different query options produce different keyParts", async () => {
        mockUnstableCache.mockClear();

        const { getPublicInsights } = await import("../server/insights");

        await getPublicInsights({ limit: 5, cursor: "c1", categorySlug: "cat1" });
        expect(mockUnstableCache).toHaveBeenCalled();
        const firstCallArgs = mockUnstableCache.mock.calls[0];
        const firstKeyParts = firstCallArgs ? firstCallArgs[1] : [];
        expect(firstKeyParts).toContain("5");
        expect(firstKeyParts).toContain("c1");
        expect(firstKeyParts).toContain("cat1");

        mockUnstableCache.mockClear();
        await getPublicInsights({ limit: 10, cursor: "c2", categorySlug: "cat2" });
        const secondCallArgs = mockUnstableCache.mock.calls[0];
        const secondKeyParts = secondCallArgs ? secondCallArgs[1] : [];
        expect(secondKeyParts).toContain("10");
        expect(secondKeyParts).toContain("c2");
        expect(secondKeyParts).toContain("cat2");

        expect(firstKeyParts).not.toEqual(secondKeyParts);
      });

      it("proves related insights query uses exclusion ID and limit in cache keyParts", async () => {
        mockUnstableCache.mockClear();
        const { getRelatedPublicInsights } = await import("../server/insights");
        await getRelatedPublicInsights("exclusion-id-1", { limit: 3 });

        const callArgs = mockUnstableCache.mock.calls[0];
        const keyParts = callArgs ? callArgs[1] : [];
        expect(keyParts).toContain("exclusion-id-1");
        expect(keyParts).toContain("3");
      });

      it("proves preview mode bypasses public caching", async () => {
        mockDraftMode.mockResolvedValueOnce({ isEnabled: true });
        mockUnstableCache.mockClear();

        const { getPublicInsights } = await import("../server/insights");
        await getPublicInsights({ limit: 5 });
        expect(mockUnstableCache).not.toHaveBeenCalled();
      });

      it("logs warning on cache invalidation failure and does not throw", async () => {
        mockRevalidateTag.mockImplementationOnce(() => {
          throw new Error("Revalidation failed");
        });
        mockLogger.warn.mockClear();

        const { invalidateTag } = await import("../server/cache");
        expect(() => invalidateTag("test-tag")).not.toThrow();
        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.stringContaining("Cache invalidation failed"),
          expect.objectContaining({ tag: "test-tag" })
        );
      });
    });

    describe("Redirect Validation", () => {
      it("rejects raw path traversal", () => {
        expect(isSafeRedirectPath("/safe/../admin")).toBe(false);
      });

      it("rejects encoded traversal", () => {
        expect(isSafeRedirectPath("/safe/%2e%2e/admin")).toBe(false);
      });

      it("rejects double encoded traversal", () => {
        expect(isSafeRedirectPath("/safe/%252e%252e/admin")).toBe(false);
      });

      it("rejects backslashes", () => {
        expect(isSafeRedirectPath("/safe\\..\\admin")).toBe(false);
      });

      it("rejects encoded slashes", () => {
        expect(isSafeRedirectPath("/safe/%5c../admin")).toBe(false);
        expect(isSafeRedirectPath("/%2f%2fevil.example")).toBe(false);
      });

      it("rejects normalized private paths", () => {
        expect(isSafeRedirectPath("/admin")).toBe(false);
        expect(isSafeRedirectPath("/api")).toBe(false);
        expect(isSafeRedirectPath("/auth")).toBe(false);
        expect(isSafeRedirectPath("/preview")).toBe(false);
      });

      it("preserves safe query params", () => {
        expect(isSafeRedirectPath("/insights/example?draft-banner=1")).toBe(true);
      });

      it("rejects control characters", () => {
        expect(isSafeRedirectPath("/safe/\n/admin")).toBe(false);
        expect(isSafeRedirectPath("/safe/%0a/admin")).toBe(false);
      });
    });

    describe("Rich Text Validation", () => {
      const validDoc = {
        root: {
          type: "root",
          children: [
            {
              type: "paragraph",
              children: [{ type: "text", text: "Hello" }]
            }
          ]
        }
      };

      it("validates safe documents", () => {
        expect(validateRichTextDocument(validDoc)).not.toBeNull();
      });

      it("rejects malformed JSON or invalid types", () => {
        expect(validateRichTextDocument(null)).toBeNull();
        expect(validateRichTextDocument("invalid")).toBeNull();
        expect(validateRichTextDocument({ root: {} })).toBeNull();
      });

      it("rejects invalid nodes", () => {
        const invalidNodeDoc = {
          root: {
            type: "root",
            children: [
              {
                type: "unknown-type",
                children: []
              }
            ]
          }
        };
        expect(validateRichTextDocument(invalidNodeDoc)).toBeNull();
      });

      it("rejects unsafe link URLs", () => {
        const unsafeLinkDoc = {
          root: {
            type: "root",
            children: [
              {
                type: "link",
                url: "javascript:alert(1)",
                children: []
              }
            ]
          }
        };
        expect(validateRichTextDocument(unsafeLinkDoc)).toBeNull();
      });

      it("handles nullable optional rich text field", () => {
        expect(validateRichTextDocument(undefined)).toBeNull();
      });
    });

    describe("Base URL policy", () => {
      const originalEnv = process.env;

      beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
      });

      afterAll(() => {
        process.env = originalEnv;
      });

      it("falls back to localhost outside production", () => {
        process.env["APP_ENV"] = "local";
        delete process.env["APP_BASE_URL"];
        expect(getTrustedBaseUrl()).toBe("http://localhost:3000/");
      });

      it("returns production valid URL normalized", () => {
        process.env["APP_ENV"] = "production";
        process.env["APP_BASE_URL"] = "https://siglum.studio";
        expect(getTrustedBaseUrl()).toBe("https://siglum.studio/");
      });

      it("returns null on production missing URL", () => {
        process.env["APP_ENV"] = "production";
        delete process.env["APP_BASE_URL"];
        expect(getTrustedBaseUrl()).toBeNull();
      });

      it("returns null on production localhost", () => {
        process.env["APP_ENV"] = "production";
        process.env["APP_BASE_URL"] = "http://localhost:3000";
        expect(getTrustedBaseUrl()).toBeNull();
      });

      it("returns null on invalid protocol", () => {
        process.env["APP_ENV"] = "production";
        process.env["APP_BASE_URL"] = "ftp://siglum.studio";
        expect(getTrustedBaseUrl()).toBeNull();
      });

      it("strips credentials", () => {
        process.env["APP_ENV"] = "production";
        process.env["APP_BASE_URL"] = "https://user:password@siglum.studio";
        expect(getTrustedBaseUrl()).toBe("https://siglum.studio/");
      });

      it("strips query and hash", () => {
        process.env["APP_ENV"] = "production";
        process.env["APP_BASE_URL"] = "https://siglum.studio/path?query=1#hash";
        expect(getTrustedBaseUrl()).toBe("https://siglum.studio/path/");
      });
    });

    describe("Sitemap Rules", () => {
      const originalEnv = process.env;

      beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
      });

      afterAll(() => {
        process.env = originalEnv;
      });

      it("returns only home route, with no request-time lastModified", async () => {
        process.env["APP_ENV"] = "production";
        process.env["APP_BASE_URL"] = "https://siglum.studio";

        const { getPublicSitemapEntries } = await import("../server/sitemap");
        const entries = await getPublicSitemapEntries();
        expect(entries.length).toBe(1);
        expect(entries[0]?.url).toBe("https://siglum.studio");
        expect(entries[0]?.lastModified).toBeUndefined();
      });

      it("returns empty sitemap on invalid production base URL", async () => {
        process.env["APP_ENV"] = "production";
        process.env["APP_BASE_URL"] = "http://localhost:3000"; // invalid in prod

        const { getPublicSitemapEntries } = await import("../server/sitemap");
        const entries = await getPublicSitemapEntries();
        expect(entries).toEqual([]);
      });
    });

    describe("Structured Data safety", () => {
      it("omits datePublished if absent", () => {
        const insight = {
          id: "id-1",
          title: "Title",
          slug: "slug",
          excerpt: "excerpt",
          bodyJson: { root: { type: "root" as const, children: [] } },
          bodyText: "",
          featured: false,
          category: { name: "cat", slug: "cat", description: null },
          author: {
            name: "author name",
            slug: "author",
            title: null,
            bio: null,
            avatarAsset: null
          },
          coverAsset: null,
          seoTitle: null,
          seoDescription: null,
          canonicalUrl: null,
          socialImageAsset: null,
          publishedAt: null
        };

        const jsonLd = buildArticleJsonLd("https://siglum.studio", insight);
        expect(jsonLd.datePublished).toBeUndefined();
      });

      it("omits optional Person/Organization properties when absent", () => {
        const settings = {
          studioName: "Studio Name",
          tagline: "",
          publicEmail: "",
          publicPhone: "",
          australianBase: "",
          defaultSeoTitle: "",
          defaultSeoDescription: "",
          companyNumber: "",
          registeredAddress: ""
        };
        const jsonLd = buildOrganizationJsonLd("https://siglum.studio", settings);
        expect(jsonLd.email).toBeUndefined();
        expect(jsonLd.telephone).toBeUndefined();
        expect(jsonLd.description).toBeUndefined();
        expect(jsonLd.sameAs).toBeUndefined();
      });

      it("does not fabricate author profile URL", () => {
        const insight = {
          id: "id-1",
          title: "Title",
          slug: "slug",
          excerpt: "excerpt",
          bodyJson: { root: { type: "root" as const, children: [] } },
          bodyText: "",
          featured: false,
          category: { name: "cat", slug: "cat", description: null },
          author: {
            name: "author name",
            slug: "author",
            title: null,
            bio: null,
            avatarAsset: null
          },
          coverAsset: null,
          seoTitle: null,
          seoDescription: null,
          canonicalUrl: null,
          socialImageAsset: null,
          publishedAt: "2026-07-15T12:00:00Z"
        };

        const jsonLd = buildArticleJsonLd("https://siglum.studio", insight);
        expect("url" in jsonLd.author).toBe(false);
      });

      it("accepts safe breadcrumbs and rejects unsafe ones", () => {
        const items = [
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
          { name: "Unsafe", path: "/work/../admin" }
        ];
        const jsonLd = buildBreadcrumbListJsonLd("https://siglum.studio", items);
        expect(jsonLd.itemListElement.length).toBe(2);
        expect(jsonLd.itemListElement[0]?.item).toBe("https://siglum.studio");
        expect(jsonLd.itemListElement[1]?.item).toBe("https://siglum.studio/work");
      });
    });

    describe("CMS Invalidation Transactions", () => {
      it("proves state changes and updates pass slugs and locations, avoiding database lookup fallbacks", async () => {
        const { prisma } = await import("@/lib/database");
        const findUniqueSpy = vi.spyOn(prisma.serviceOffering, "findUnique");

        const { invalidateServiceContent } =
          await import("../../cms/shared/server/cache");

        invalidateServiceContent("some-id");
        expect(findUniqueSpy).not.toHaveBeenCalled();
      });
    });
  });
});
