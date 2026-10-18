# Phase 8 - Public Content Delivery Module

This document outlines the architecture, data contracts, caching strategies, and
security policies governing the public-facing content delivery APIs and routing in
Siglum Studio.

---

## 1. Module Architecture

The codebase cleanly separates public-facing content queries from administrative CMS
management operations:

- **Public Content Module (`src/modules/public-content`)**:
  - **Domain (`src/modules/public-content/domain`)**: Contains pure business logic, DTO
    mapping structures, metadata builders, structured data serializers, route
    canonicalizers, redirect validators, and trusted base URL normalizers.
  - **Server (`src/modules/public-content/server`)**: Contains database access
    operations, caching layers, preview resolution handlers, and Next.js route adapters.
  - **Types (`src/modules/public-content/types`)**: Defines strict TypeScript interfaces
    for public DTO boundaries.
- **CMS Module (`src/modules/cms`)**: Handles administrative workflows, drafts,
  publications, assets, and audit logs. CMS mutations explicitly manage database state
  and invoke cache invalidation routines.

---

## 2. Public DTO Boundaries

All public query endpoints map raw Prisma models into strict Public DTO structures
before returning them to callers. This guarantees that internal metadata and sensitive
database columns are never exposed to the client.

- **Media Assets**: Publicly exposed as `PublicMediaDTO`, stripping private columns such
  as `storageKey`, `incomingKey`, `uploadRequestToken`, `declaredChecksum`, `checksum`,
  `failureCode`, and `failureMessage`.
- **Authors**: Publicly exposed as `PublicAuthorDTO`, stripping internal fields such as
  `userId`, `email`, and `user` relations.
- **Services, Projects, Insights, FAQs, Navigation, and Site Settings**: All mapped to
  dedicated DTO interfaces using explicit allowlists.

---

## 3. Validated Rich-Text Delivery

Public rich-text fields (e.g. body json, biography json, FAQ answer json) are validated
to ensure only well-formed Lexical structures are returned.

- **Schema Enforcement**: The `validateRichTextDocument` schema validates the JSON
  document structure.
- **Invalid Nodes Removal**: Malformed or unapproved custom nodes are excluded.
- **Link Sanitization**: URLs in link nodes are validated. Unsafe protocols (e.g.
  `javascript:`, `data:`, `vbscript:`) are rejected and mapped to safe stand-ins.
- **Nullability Handling**: Malformed or missing rich-text content yields `null` or is
  omitted.

---

## 4. Publication and Preview Policies

- **Publication Filter**: In standard mode, only items with `status: "PUBLISHED"` and a
  `publishedAt` date in the past are delivered. Future-scheduled publications and
  archived records are excluded.
- **Preview Mode (Draft Mode)**:
  - If `draftMode()` is active, query APIs bypass the public cache and deliver both
    drafts and scheduled posts.
  - The preview endpoint validates incoming slugs (`validateSlug`). An invalid slug
    returns a `400 Bad Request`.
  - Authentication or authorization failures in the preview resolution collapse into a
    standard `403 Forbidden` error page.

---

## 5. Media Delivery Policy

Only publicly deliverable media assets are returned in public DTO mappings:

- **`READY`**: Assets that have been successfully uploaded and finalized in the storage
  bucket.
- **`ARCHIVED`**: Previously verified assets (containing a valid storage key, finalized
  timestamp, public URL, and valid image dimensions if it is an image) remain publicly
  deliverable for existing references.
- **Excluded**: All other states (e.g. `PENDING_UPLOAD`, `VERIFYING`, `FAILED`,
  `DELETED`, `DELETION_PENDING`, `ACTIVE`) and legacy unverified `ARCHIVED` records are
  replaced with `null` or omitted.

---

## 6. Cache Identities & Key Parts

Caching uses Next.js `unstable_cache` with a clear division between **cache identities**
(cache keys) and **invalidation tags**:

- **PublicCacheOptions Contract**:
  ```ts
  type PublicCacheOptions = Readonly<{
    keyParts: ReadonlyArray<string>;
    tags: ReadonlyArray<string>;
  }>;
  ```
- **Identity Isolation**: Key parts dynamically incorporate cursors, limits, category
  filters, item slugs, and related-content exclusion lists (e.g.,
  `["public-insights", normalizedCursor, String(limit), categorySlug || ""]`).
- **Preview Bypass**: If draft mode is enabled, `withPublicCache` bypasses
  `unstable_cache` entirely.
- **Observability**: Cache invalidation failures are caught and logged with
  `logger.warn`, preventing background cache operations from rolling back primary
  database transactions.

---

## 7. Cache Invalidation Matrix

CMS mutations trigger explicit invalidations. Background/fire-and-forget database
lookups are completely removed from cache invalidation helpers. Transactions return
current and previous slugs/locations, which are passed directly to `invalidateTag`.

| CMS Mutation                               | Invalidated Cache Tags                                                                                                                                                                                  |
| :----------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Service Draft Save / Publish / Archive** | `public:services`, `public:sitemap`, `public:service:${slug}`, `public:service:${oldSlug}` (if slug changed)                                                                                            |
| **Project Draft Save / Publish / Archive** | `public:projects`, `public:sitemap`, `public:project:${slug}`, `public:project:${oldSlug}` (if slug changed)                                                                                            |
| **Insight Draft Save / Publish / Archive** | `public:insights`, `public:sitemap`, `public:insight:${slug}`, `public:insight:${oldSlug}` (if slug changed), `public:insights:category:${categorySlug}`, `public:insights:category:${oldCategorySlug}` |
| **Navigation Save / Move**                 | `public:navigation:${location}`, `public:navigation:${oldLocation}` (if location changed)                                                                                                               |
| **Media Finalization**                     | `public:services`, `public:projects`, `public:insights`, `public:team`                                                                                                                                  |
| **Site Settings Update**                   | `public:settings`, `public:services`, `public:projects`, `public:insights`, `public:sitemap`                                                                                                            |

---

## 8. Trusted Base URL Policy

The base URL is strictly validated using `getTrustedBaseUrl()` (implemented in
`src/modules/public-content/domain/routes.ts`):

- **Stripping**: Credentials, query params, hashes, and trailing slashes are parsed and
  normalized.
- **Local Fallback**: Outside of production (`APP_ENV !== "production"`), a default
  fallback of `http://localhost:3000` is allowed if `APP_BASE_URL` is missing.
- **Production Constraints**: In production, `localhost` base URLs are rejected. If
  `APP_BASE_URL` is missing or invalid:
  - Metadata generation injects a strict `noindex, nofollow` directive.
  - `/sitemap.xml` returns an empty array.
  - `/robots.txt` returns `Disallow: /` and suppresses the sitemap link.

---

## 9. Redirect Normalization & Security

Redirect destinations are validated via `isSafeRedirectPath()`:

- **Traversal Prevention**: Raw or encoded traversal sequences (e.g. `..`, `%2e%2e`,
  `%252e%252e`, `%5c`) are rejected.
- **Protocol Check**: Only relative paths are permitted. Unsafe protocols (e.g.,
  `javascript:`) are blocked.
- **Private Route Validation**: Pathnames matching `/admin`, `/api`, `/auth`, or
  `/preview` are rejected.
- **Normalisation**: Pathnames are fully normalized before safety validation checks are
  performed. Bounded double-decoding checks protect against obfuscation.

---

## 10. Metadata & Structured Data

- **Canonical URLs**: Generated dynamically using the trusted base URL, preventing
  duplicate content search penalties.
- **Structured Data (JSON-LD)**:
  - Uses standard schema definitions (FAQPage, Article, Organization, BreadcrumbList).
  - Absent publication dates and optional fields are omitted rather than serialized as
    placeholders.
  - `<` characters are escaped to `\u003c` during serialization to block cross-site
    scripting (XSS).
  - Breadcrumbs validate their pathnames using `isSafeRedirectPath`.

---

## 11. Sitemap & Robots Configuration

- **Sitemap Route (`/sitemap.xml`)**: Adapter route `/app/sitemap.ts` returns active
  database urls and static pages. No request-time dynamic `lastModified` is generated
  for static routes to optimize cache hit rates.
- **Robots Route (`/robots.txt`)**: Configures production vs staging indexing
  guidelines.

---

## 12. Integration and Unit Testing

- **Unit Tests**: Written in `src/modules/public-content/tests/unit.test.ts` (56 passing
  assertions). Mocks Next.js components and database client to verify:
  - Identity-specific cache keys for queries.
  - Redirect path traversal & Protocol security.
  - Rich-text Lexical document node validation.
  - Canonical URL normalisation and escaping.
  - Sitemap production base URL rules.
- **Integration Tests**: Database-backed tests (22 passing assertions) verify end-to-end
  workflows including publication filtering, private field protection, order-by sorting,
  navigation hierarchies, and settings allowlists.

---

## 13. Deferred Frontend Work

The backend data and caching boundary is fully complete and covered by tests. The
following frontend tasks are deferred to the next phase:

1.  **Frontend Layout Integration**: Consuming `getPublicSettings()` inside the root
    Next.js layout to map allowlisted studio name, tagline, and contact information.
2.  **Sitemap Rendering Style**: Adding a styling template overlay for sitemap rendering
    if required for visual formatting.
3.  **Rich-Text Renderer**: Implementing React components to parse and render Lexical
    nodes outputted from `validateRichTextDocument`.
