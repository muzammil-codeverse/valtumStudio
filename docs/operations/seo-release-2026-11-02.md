# Valtum Studio — SEO release and indexability register

**Date:** 2 November 2026  
**Canonical public domain:** https://valtumstudio.com.au  
**Repository:** muzammil-codeverse/valtumStudio  
**Scope:** SEO infrastructure and verified editorial positioning. Does not alter CMS
databases, client portals, operational credentials, marketing motion or case-study truth
claims.

## Research provenance and boundaries

The 19 October 2026 40-studio global research is a sample of **40 studios**, not 40
independently available SEO audits. Its guidance is to lead with buyer problems,
operational software expertise, accountable decisions and genuine case-study evidence,
rather than unverified impact or keyword lists. The source-of-truth and product audits
caution against claiming revenue, deployments, accuracy, testimonials or customer
results without verification.

Current Google Search Central guidance:

- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- https://developers.google.com/search/docs/crawling-indexing/canonicalization
- https://developers.google.com/search/docs/appearance/structured-data/organization
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content

## Live baseline confirmed before this change

1. The live `/sitemap.xml` returned **only the root URL** even though 17 public
   destinations exist.
2. The live `/robots.txt` blocked `/_next` and `/static`, making it harder for crawlers
   to obtain stylesheet and JavaScript resources.
3. Generic page titles such as "Valtum Studio", "Work | Valtum Studio", and "Services |
   Valtum Studio" under-described relevant services and products.
4. Homepage metadata depended on database/CMS settings and could stay generic or suffer
   an outage.
5. The Organization and WebSite structured-data helpers existed but were not rendered on
   the public homepage.
6. The homepage heading and artwork are deliberately authored and should remain
   unchanged.

## Changes in this release

- Stable canonical production URL helpers and explicit production-only indexability
  checks, with Vercel preview/noindex protection.
- Crawler rules disallow private application areas while **allowing Next.js CSS,
  JavaScript and image resources**.
- A sitemap containing the **17 actually implemented public routes**, omitting legacy
  redirects, protected areas, previews and absent CMS insight URLs. No invented
  modification dates.
- Distinct human-written titles and descriptions for each of the eight principal pages,
  four service pages, and five original case studies. Preserve creative H1s and site
  choreography.
- Per-page canonical URL, Open Graph metadata, Twitter/X preview metadata and a branded
  raster social preview.
- Homepage Organization and WebSite JSON-LD, service and work-item JSON-LD plus
  meaningful page breadcrumbs. No fabricated client ratings, reviews, awards or ROI.
- Stable metadata while the CMS is down, and two small homepage explanatory-copy
  refinements that identify the engineering practice without changing the hero.
- Focused tests on sitemap coverage, crawl rules, canonical URL safety, metadata
  uniqueness and non-production noindex behavior.

## Target search intent (research hypothesis, not measured volume)

**Core Australia:** custom software development, web application development, digital
product design, workflow/operations software.

**Qualified specialisms:** marketplace and booking platform engineering, logistics and
dispatch software, AI/computer vision decision support, creative website engineering.

Target focused pages and substantiated case studies for these intents; **do not**
generate duplicate city or tech-stack landing pages, and do not present unverified
search volumes or rank estimates.

## Operator-only tasks: Google Search Console

The user previously established a Search Console property; confirm it is a **domain
property for valtumstudio.com.au** or add the domain property, verified through its DNS
TXT record.

1. Open Search Console → Sitemaps and submit `https://valtumstudio.com.au/sitemap.xml`.
2. Use URL Inspection for the homepage, Services, Solutions, Work, one service detail,
   and one case-study page. Select **Test live URL**; if allowed, **Request indexing**
   for priority URLs.
3. Check Page indexing for excluded/error pages, canonical selection, duplicate URLs,
   blocked resources and server failures. Inspect live renders of representative pages.
4. Use Performance → Search results to establish real impressions, queries, countries
   and CTR. Track nonbranded qualified queries separately from branded traffic; use
   documented date ranges.
5. Monitor Core Web Vitals (field data), mobile layout and server responsiveness. Motion
   quality must not hide real headings/content from renderers. Do not infer a passing
   CWV score from a successful build.
6. Verify that https://www.valtumstudio.com.au redirects to the canonical host and that
   no old deployment URL is promoted as canonical in metadata.

**Important:** A sitemap and a request to index are discovery/processing signals, not a
guarantee Google will crawl, index or rank a page. Results depend on competition, real
page usefulness, earned references, domain reputation, and performance over time.

## Publication gates / evidence still missing

- Google Search Console actual URL inspection reports and index coverage: requires
  account access.
- Verified query impressions, search position, indexed page counts and organic
  conversions: unavailable without Search Console and analytics.
- Rich Results Test results on published URLs: requires testing after deployment; valid
  JSON-LD alone is not a promise of rich results.
- Real product case-study results, permissions for identifiable client proof, author
  attribution and any original editorial pieces: publish only once independently
  substantiated.
- Core Web Vitals from real users and mobile-browser visual inspection: not established
  by this code release.

## Release acceptance

- GitHub formatting, lint, typecheck, unit tests, build, database/other existing CI
  gates pass.
- Production sitemap serves 17 canonical public URLs; previews return no indexable
  discovery sitemap.
- Production robots.txt does not disallow `/_next`, blocks private routes, and
  references the canonical sitemap.
- Home and service markup emit canonical title/description, OG/Twitter metadata and
  appropriate JSON-LD. Private portals remain protected and are not indexed.
- Production home page continues to display the approved "Good ideas. Beautifully
  built." experience.

## Branded discovery follow-up (2 November 2026)

- Foreground `Valtum Studio` in the homepage search title, while keeping commercial service intent in the title and description.
- Supply `Valtum` as an alternate Organization/WebSite name, with links to the verified Clutch and The Manifest company listings. The CMS may add verified LinkedIn/Instagram company profiles through existing `publicSocialLinks` fields; unknown handles are intentionally not fabricated.
- Google sitelinks and knowledge panels are algorithmic, not directly creatable or guaranteed; this release supplies eligible pages, internal links and entity-disambiguation evidence.
- Google Search Console inspection and sitemap submission still require the authorized property interface; repository deployment cannot submit them on the user's behalf.
