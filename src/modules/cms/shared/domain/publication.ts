export type PublicationState = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export function canTransition(from: PublicationState, to: PublicationState): boolean {
  return (
    (from === "DRAFT" && (to === "PUBLISHED" || to === "ARCHIVED")) ||
    (from === "PUBLISHED" && to === "ARCHIVED") ||
    (from === "ARCHIVED" && to === "DRAFT")
  );
}

export function publicationStateUpdate(state: PublicationState): Readonly<{
  status: PublicationState;
  publishedAt?: Date | null;
  archivedAt?: Date | null;
}> {
  const now = new Date();
  if (state === "PUBLISHED")
    return { status: state, publishedAt: now, archivedAt: null };
  if (state === "ARCHIVED") return { status: state, archivedAt: now };
  return { status: state, archivedAt: null };
}
