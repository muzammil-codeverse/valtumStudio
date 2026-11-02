import { studioContact, studioOrganizationProfiles } from "@/config/studio-presence";

import type {
  PublicFaqGroupDTO,
  PublicInsightDTO,
  PublicServiceDTO,
  PublicSettingsDTO
} from "../types/dto";
import { isSafeRedirectPath } from "./redirects";
import { generateCanonicalUrl, publicRoutes } from "./routes";

/**
 * Escapes characters like < to prevent script injection in script tags.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Builds Organization structured data.
 */
export function buildOrganizationJsonLd(
  appBaseUrl: string,
  _settings: PublicSettingsDTO
) {
  // Compatibility with the existing CMS-facing helper signature.
  void _settings;
  const baseCanonical = generateCanonicalUrl("/", appBaseUrl);
  const orgId = `${baseCanonical}#organization`;

  // Only studio-owned profiles and a separate official registry reference.
  // The founder's personal LinkedIn identity is represented under founder.
  const sameAs = [...studioOrganizationProfiles];

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": orgId,
    name: "Valtum Studio",
    alternateName: "Valtum",
    foundingDate: "2026",
    founder: {
      "@type": "Person",
      name: "Abdur Rehman Khalid",
      url: "https://www.linkedin.com/in/abdurrehmankhalid/"
    },
    identifier: {
      "@type": "PropertyValue",
      propertyID: "Australian Business Number",
      value: "24 207 947 663",
      url: "https://abr.business.gov.au/ABN/View?id=24207947663"
    },
    url: baseCanonical,
    logo: {
      "@type": "ImageObject",
      url: generateCanonicalUrl("/branding/valtum-symbol-black.svg", appBaseUrl)
    },
    description:
      "Valtum Studio is an independent Australian software and digital product studio designing custom applications, operational systems, AI tools and distinctive digital experiences.",
    email: studioContact.email,
    telephone: studioContact.phone,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: studioContact.email,
      telephone: studioContact.phone,
      availableLanguage: ["English"]
    },
    sameAs
  };
}

/**
 * Builds WebSite structured data.
 */
export function buildWebSiteJsonLd(appBaseUrl: string, settings: PublicSettingsDTO) {
  const baseCanonical = generateCanonicalUrl("/", appBaseUrl);
  const siteId = `${baseCanonical}#website`;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": siteId,
    name: settings.studioName,
    alternateName: "Valtum",
    url: baseCanonical
  };
}

/**
 * Builds Service structured data.
 */
export function buildServiceJsonLd(appBaseUrl: string, service: PublicServiceDTO) {
  const serviceUrl = generateCanonicalUrl(
    publicRoutes.service(service.slug),
    appBaseUrl
  );
  const baseCanonical = generateCanonicalUrl("/", appBaseUrl);

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.summary,
    url: serviceUrl,
    provider: {
      "@type": "Organization",
      "@id": `${baseCanonical}#organization`
    }
  };
}

/**
 * Builds Article (Insight) structured data.
 */
export function buildArticleJsonLd(appBaseUrl: string, insight: PublicInsightDTO) {
  const articleUrl = generateCanonicalUrl(
    publicRoutes.insight(insight.slug),
    appBaseUrl
  );
  const baseCanonical = generateCanonicalUrl("/", appBaseUrl);
  const publisherId = `${baseCanonical}#organization`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: insight.title,
    description: insight.excerpt,
    url: articleUrl,
    ...(insight.publishedAt && insight.publishedAt.trim() !== ""
      ? { datePublished: insight.publishedAt.trim() }
      : {}),
    author: {
      "@type": "Person",
      name: insight.author.name
    },
    ...(insight.coverAsset?.url && insight.coverAsset.url.trim() !== ""
      ? { image: [insight.coverAsset.url.trim()] }
      : {}),
    publisher: {
      "@type": "Organization",
      "@id": publisherId
    }
  };
}

/**
 * Builds FAQPage structured data.
 */
export function buildFAQPageJsonLd(faqGroup: PublicFaqGroupDTO) {
  const mainEntity = faqGroup.items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answerText
    }
  }));

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity
  };
}

/**
 * Builds BreadcrumbList structured data.
 */
export function buildBreadcrumbListJsonLd(
  appBaseUrl: string,
  items: ReadonlyArray<{ name: string; path: string }>
) {
  const itemListElement = items
    .filter((item) => isSafeRedirectPath(item.path))
    .map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: generateCanonicalUrl(item.path, appBaseUrl)
    }));

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement
  };
}
