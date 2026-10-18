import "server-only";

import { draftMode } from "next/headers";

import { type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/database";
import { validateRichTextDocument } from "@/modules/cms/shared/domain/rich-text";

import { mapPublicMedia, type MediaFields } from "../domain/media";
import type { PublicTeamMemberDTO } from "../types/dto";
import { cacheTags, withPublicCache } from "./cache";

async function isPreviewMode(): Promise<boolean> {
  try {
    const draft = await draftMode();
    return draft.isEnabled;
  } catch {
    return false;
  }
}

type TeamMemberRecord = {
  name: string;
  slug: string;
  roleTitle: string;
  shortBio: string | null;
  bioJson: Prisma.JsonValue;
  bioText: string | null;
  portraitAsset: MediaFields | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  featured: boolean;
};

/**
 * Maps a Prisma team member record to PublicTeamMemberDTO.
 */
function mapTeamMember(member: TeamMemberRecord): PublicTeamMemberDTO {
  const doc = validateRichTextDocument(member.bioJson);
  return {
    name: member.name,
    slug: member.slug,
    roleTitle: member.roleTitle,
    shortBio: member.shortBio,
    bioJson: doc,
    bioText: member.bioText,
    portraitAsset: mapPublicMedia(member.portraitAsset),
    linkedinUrl: member.linkedinUrl,
    websiteUrl: member.websiteUrl,
    featured: member.featured
  };
}

const TEAM_SELECT = {
  name: true,
  slug: true,
  roleTitle: true,
  shortBio: true,
  bioJson: true,
  bioText: true,
  linkedinUrl: true,
  websiteUrl: true,
  featured: true,
  portraitAsset: {
    select: {
      status: true,
      storageKey: true,
      mimeType: true,
      finalizedAt: true,
      publicUrl: true,
      width: true,
      height: true,
      altText: true,
      caption: true,
      credit: true
    }
  }
};

/**
 * Returns all publicly visible team members ordered by sortOrder asc, then id asc.
 */
export async function getPublicTeamMembers(): Promise<
  ReadonlyArray<PublicTeamMemberDTO>
> {
  const isPreview = await isPreviewMode();

  const query = async () => {
    const now = new Date();
    const where = isPreview
      ? {}
      : {
          status: "PUBLISHED" as const,
          publishedAt: { lte: now },
          archivedAt: null
        };

    const members = await prisma.teamMember.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: TEAM_SELECT
    });

    return members.map(mapTeamMember);
  };

  if (isPreview) {
    return query();
  }

  return withPublicCache(query, {
    keyParts: ["team"],
    tags: [cacheTags.team]
  });
}

/**
 * Returns a team member by slug.
 */
export async function getPublicTeamMemberBySlug(
  slug: string
): Promise<PublicTeamMemberDTO | null> {
  const isPreview = await isPreviewMode();

  const query = async () => {
    const now = new Date();
    const where = isPreview
      ? { slug }
      : {
          slug,
          status: "PUBLISHED" as const,
          publishedAt: { lte: now },
          archivedAt: null
        };

    const member = await prisma.teamMember.findFirst({
      where,
      select: TEAM_SELECT
    });

    return member ? mapTeamMember(member) : null;
  };

  if (isPreview) {
    return query();
  }

  return withPublicCache(query, {
    keyParts: ["team-member", slug],
    tags: [cacheTags.team]
  });
}
