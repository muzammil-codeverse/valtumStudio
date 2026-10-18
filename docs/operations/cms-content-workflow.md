# CMS content workflow

Editors create and update drafts and may use authenticated internal previews. Admins and
owners can publish, archive, and restore. Restore returns content to `DRAFT`; it does
not republish it.

Publishing validates readiness on the server. Archived content remains auditable.
Published content is archived instead of being casually deleted. A stale editor receives
a conflict and must reload before saving again.
