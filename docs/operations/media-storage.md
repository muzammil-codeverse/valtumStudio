# Media storage

The media module uses a server-only storage boundary. A configured S3-compatible driver
must issue a short-lived upload intent, and the server must verify the uploaded object
before registering its `MediaAsset` metadata.

Accepted V1 MIME types are JPEG, PNG, WebP, and AVIF. SVG is rejected. Media is archived
by default rather than permanently deleted. Required configuration is
`MEDIA_STORAGE_DRIVER`, `MEDIA_STORAGE_ENDPOINT`, `MEDIA_STORAGE_REGION`,
`MEDIA_STORAGE_BUCKET`, `MEDIA_STORAGE_ACCESS_KEY_ID`,
`MEDIA_STORAGE_SECRET_ACCESS_KEY`, `MEDIA_STORAGE_PUBLIC_BASE_URL`, and
`MEDIA_MAX_UPLOAD_BYTES`; do not place actual secrets in examples or client code.
