# Phase 7: production media storage

Siglum Studio stores image metadata in PostgreSQL and binary objects in an S3-compatible
provider. Browser uploads never pass through a Server Action.

## Lifecycle and storage layout

New assets begin as `PENDING_UPLOAD`, move to `VERIFYING`, and only become `READY` after
server verification. A failed verification becomes `FAILED`; archiving and deletion use
`ARCHIVED`, `DELETION_PENDING`, and `DELETED`. Legacy Phase 5 `ACTIVE` rows are
backfilled to `ARCHIVED`: their old metadata is preserved, but they are not claimed to
be verified.

The application generates every object key. Browser uploads go to:

```text
<MEDIA_KEY_PREFIX>/incoming/media/<asset-id>/<nonce>.<declared-extension>
```

After verification, the service copies bytes to an immutable key:

```text
<MEDIA_KEY_PREFIX>/public/media/<year>/<month>/<asset-id>-<checksum-prefix>.<verified-extension>
```

Expose only the verified `public` prefix through a bucket policy/CDN. Incoming objects
must not be public.

## Environment

Variables: `MEDIA_STORAGE_ENABLED`, `MEDIA_S3_REGION`, `MEDIA_S3_ENDPOINT`,
`MEDIA_S3_BUCKET`, `MEDIA_S3_ACCESS_KEY_ID`, `MEDIA_S3_SECRET_ACCESS_KEY`,
`MEDIA_S3_FORCE_PATH_STYLE`, `MEDIA_PUBLIC_BASE_URL`, `MEDIA_KEY_PREFIX`,
`MEDIA_UPLOAD_URL_TTL_SECONDS`, `MEDIA_READ_URL_TTL_SECONDS`, `MEDIA_MAX_IMAGE_BYTES`,
`MEDIA_MAX_IMAGE_WIDTH`, `MEDIA_MAX_IMAGE_HEIGHT`, `MEDIA_MAX_IMAGE_PIXELS`, and
`MEDIA_REQUIRE_SHA256_CHECKSUM`.

With storage disabled, no credentials are required, S3 is never contacted, and the admin
uploader returns a controlled disabled state. When enabled, all provider credentials and
endpoint values are validated server-side. Credentials are never exposed to the browser.

## Upload and verification

Only authenticated CMS users with media-create permission can reserve uploads. The
client supplies a bounded opaque idempotency token, declared image metadata, and a Web
Crypto SHA-256 checksum. The server creates a `PENDING_UPLOAD` row and returns a
short-lived, exact-key presigned PUT URL and signed headers.

The browser uploads directly with those headers, then calls finalization. Finalization
atomically claims the row, checks expiry, heads the object, reads bounded ranges for
JPEG/PNG/WebP signatures and dimensions, calculates SHA-256 over bounded chunks, checks
declared/provider checksum data, and promotes only verified bytes. JPEG, PNG, and WebP
are supported; SVG, GIF, AVIF, documents, audio, video, and arbitrary files are
rejected.

Final keys derive from verified content, public URLs are derived from
`MEDIA_PUBLIC_BASE_URL`, and presigned URLs are neither stored nor logged. Without a
public base URL, assets remain usable in administration through future signed-read
support but no permanent URL is fabricated.

## Operations

Reservations and finalization are idempotent. Replayed upload tokens return the same
pending reservation; repeated finalization of a READY asset returns the existing result.
A simultaneous finalizer cannot claim the same revision. Identical verified checksums
are reported as duplicates rather than silently replacing metadata.

Archiving hides an asset from new picker selections but preserves existing references
and its object. Permanent deletion is restricted to owners/admins, is blocked by every
known CMS reference, changes database state before the network delete, and leaves a
recoverable state if object deletion fails. Storage calls are outside Prisma
transactions.

## Delivery and provider setup

`MEDIA_PUBLIC_BASE_URL` is parsed as a trusted URL and is used for an exact Next.js
`images.remotePatterns` entry when storage is enabled. Immutable verified keys use
long-lived cache headers. Configure provider CORS to permit authenticated admin origins
to `PUT` incoming keys with `content-type` and, when required, `x-amz-checksum-sha256`;
restrict exposed/public reads to the verified prefix. Do not make incoming objects
public.

Expired reservations and best-effort incoming cleanup require a scheduled operational
cleanup job; Phase 7 intentionally does not provision scheduler infrastructure. Provider
smoke tests, real credentials, CORS/bucket policy changes, malware scanning, and the
public CMS/site work in Phases 8–15 are deferred.

## Validation commands

Run `corepack pnpm db:format`, `corepack pnpm db:validate`, `corepack pnpm db:generate`,
`corepack pnpm lint`, `corepack pnpm typecheck`,
`corepack pnpm exec vitest run src/modules/cms/media`,
`corepack pnpm exec vitest run src/config/env`, and
`corepack pnpm exec vitest list --config vitest.integration.config.ts` after configuring
the local test database. Do not apply the migration as part of these checks.
