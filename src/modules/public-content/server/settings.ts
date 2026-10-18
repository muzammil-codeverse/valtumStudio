import "server-only";

import { prisma } from "@/lib/database";

import { mapPublicMedia } from "../domain/media";
import type { PublicMediaDTO, PublicSettingsDTO } from "../types/dto";
import { cacheTags, withPublicCache } from "./cache";

/**
 * Returns allowlisted public settings.
 * Ignores all internal settings, secrets, and private keys.
 */
export async function getPublicSettings(): Promise<PublicSettingsDTO> {
  const query = async () => {
    const keys = [
      "site.identity",
      "site.contact",
      "site.social",
      "site.seo",
      "site.legal"
    ];

    const records = await prisma.siteSetting.findMany({
      where: {
        key: { in: keys }
      },
      select: {
        key: true,
        value: true
      }
    });

    const settingsMap = new Map<string, Record<string, string | undefined>>();
    for (const record of records) {
      if (
        record.value &&
        typeof record.value === "object" &&
        !Array.isArray(record.value)
      ) {
        settingsMap.set(record.key, record.value as Record<string, string | undefined>);
      }
    }

    const identity = settingsMap.get("site.identity");
    const contact = settingsMap.get("site.contact");
    const social = settingsMap.get("site.social");
    const seo = settingsMap.get("site.seo");
    const legal = settingsMap.get("site.legal");

    const resultObj: {
      studioName: string;
      tagline?: string;
      publicEmail?: string;
      publicPhone?: string;
      publicSocialLinks?: {
        linkedinUrl?: string;
        instagramUrl?: string;
      };
      australianBase?: string;
      defaultSeoTitle?: string;
      defaultSeoDescription?: string;
      defaultSocialImageAsset?: PublicMediaDTO | null;
      companyNumber?: string;
      registeredAddress?: string;
    } = {
      studioName: identity?.["siteName"] ?? "Siglum Studio"
    };

    // Strict exactOptionalPropertyTypes validation
    if (identity?.["tagline"]) {
      resultObj.tagline = identity["tagline"];
    }
    if (contact?.["contactEmail"]) {
      resultObj.publicEmail = contact["contactEmail"];
    }
    if (contact?.["contactPhone"]) {
      resultObj.publicPhone = contact["contactPhone"];
    }
    if (contact?.["businessLocation"]) {
      resultObj.australianBase = contact["businessLocation"];
    }

    const socialLinks: { linkedinUrl?: string; instagramUrl?: string } = {};
    if (social?.["linkedinUrl"]) {
      socialLinks.linkedinUrl = social["linkedinUrl"];
    }
    if (social?.["instagramUrl"]) {
      socialLinks.instagramUrl = social["instagramUrl"];
    }
    if (Object.keys(socialLinks).length > 0) {
      resultObj.publicSocialLinks = socialLinks;
    }

    if (seo?.["defaultSeoTitle"]) {
      resultObj.defaultSeoTitle = seo["defaultSeoTitle"];
    }
    if (seo?.["defaultSeoDescription"]) {
      resultObj.defaultSeoDescription = seo["defaultSeoDescription"];
    }
    let defaultSocialImageAsset: PublicMediaDTO | null = null;
    if (seo?.["defaultSocialImageAssetId"]) {
      const asset = await prisma.mediaAsset.findUnique({
        where: { id: seo["defaultSocialImageAssetId"] }
      });
      if (asset) {
        defaultSocialImageAsset = mapPublicMedia({
          status: asset.status,
          storageKey: asset.storageKey,
          mimeType: asset.mimeType,
          finalizedAt: asset.finalizedAt,
          publicUrl: asset.publicUrl,
          width: asset.width,
          height: asset.height,
          altText: asset.altText,
          caption: asset.caption,
          credit: asset.credit
        });
      }
    }
    if (defaultSocialImageAsset) {
      resultObj.defaultSocialImageAsset = defaultSocialImageAsset;
    }
    if (legal?.["companyNumber"]) {
      resultObj.companyNumber = legal["companyNumber"];
    }
    if (legal?.["registeredAddress"]) {
      resultObj.registeredAddress = legal["registeredAddress"];
    }

    return resultObj as PublicSettingsDTO;
  };

  return withPublicCache(query, {
    keyParts: ["settings"],
    tags: [cacheTags.settings]
  });
}
