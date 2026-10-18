import type { RichTextDocument } from "@/modules/cms/shared/domain/rich-text";

export type PublicMediaDTO = Readonly<{
  url: string;
  width: number | null;
  height: number | null;
  mimeType: string;
  altText: string | null;
  caption: string | null;
  credit: string | null;
}>;

export type PublicCapabilityDTO = Readonly<{
  title: string;
  description: string | null;
}>;

export type PublicServiceDTO = Readonly<{
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string | null;
  featured: boolean;
  sortOrder: number;
  heroAsset: PublicMediaDTO | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  socialImageAsset: PublicMediaDTO | null;
  publishedAt: string | null;
  capabilities: ReadonlyArray<PublicCapabilityDTO>;
}>;

export type PublicProjectSectionDTO = Readonly<{
  kind: "OVERVIEW" | "CHALLENGE" | "SOLUTION" | "OUTCOME" | "PROCESS" | "CUSTOM";
  heading: string | null;
  bodyJson: RichTextDocument | null;
  bodyText: string | null;
}>;

export type PublicProjectMediaDTO = Readonly<{
  mediaAsset: PublicMediaDTO;
  role: "COVER" | "GALLERY" | "INLINE";
  caption: string | null;
  altOverride: string | null;
}>;

export type PublicTechnologyDTO = Readonly<{
  name: string;
  slug: string;
}>;

export type PublicProjectDTO = Readonly<{
  id: string;
  slug: string;
  title: string;
  summary: string;
  challenge: string | null;
  solution: string | null;
  outcome: string | null;
  projectYear: number | null;
  featured: boolean;
  sortOrder: number;
  coverAsset: PublicMediaDTO | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  socialImageAsset: PublicMediaDTO | null;
  publishedAt: string | null;
  sections: ReadonlyArray<PublicProjectSectionDTO>;
  media: ReadonlyArray<PublicProjectMediaDTO>;
  technologies: ReadonlyArray<PublicTechnologyDTO>;
  services: ReadonlyArray<Readonly<{ id: string; title: string; slug: string }>>;
}>;

export type PublicInsightCategoryDTO = Readonly<{
  name: string;
  slug: string;
  description: string | null;
}>;

export type PublicAuthorDTO = Readonly<{
  name: string;
  slug: string;
  title: string | null;
  bio: string | null;
  avatarAsset: PublicMediaDTO | null;
}>;

export type PublicInsightDTO = Readonly<{
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  bodyJson: RichTextDocument;
  bodyText: string;
  featured: boolean;
  category: PublicInsightCategoryDTO;
  author: PublicAuthorDTO;
  coverAsset: PublicMediaDTO | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  socialImageAsset: PublicMediaDTO | null;
  publishedAt: string | null;
}>;

export type PublicFaqItemDTO = Readonly<{
  question: string;
  answerJson: RichTextDocument;
  answerText: string;
}>;

export type PublicFaqGroupDTO = Readonly<{
  title: string;
  slug: string;
  description: string | null;
  items: ReadonlyArray<PublicFaqItemDTO>;
}>;

export type PublicTeamMemberDTO = Readonly<{
  name: string;
  slug: string;
  roleTitle: string;
  shortBio: string | null;
  bioJson: RichTextDocument | null;
  bioText: string | null;
  portraitAsset: PublicMediaDTO | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  featured: boolean;
}>;

export type PublicNavigationItemDTO = Readonly<{
  type: "INTERNAL" | "EXTERNAL" | "GROUP" | "CTA";
  label: string;
  href: string | null;
  openInNewTab: boolean;
  children: ReadonlyArray<PublicNavigationItemDTO>;
}>;

export type PublicSettingsDTO = Readonly<{
  studioName: string;
  tagline?: string;
  publicEmail?: string;
  publicPhone?: string;
  publicSocialLinks?: Readonly<{
    linkedinUrl?: string;
    instagramUrl?: string;
  }>;
  australianBase?: string;
  defaultSeoTitle?: string;
  defaultSeoDescription?: string;
  defaultSocialImageAsset?: PublicMediaDTO | null;
  companyNumber?: string;
  registeredAddress?: string;
}>;

export type PublicPage<T> = Readonly<{
  items: ReadonlyArray<T>;
  nextCursor: string | null;
  hasMore: boolean;
}>;
