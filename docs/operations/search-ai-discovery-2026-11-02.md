# Valtum Studio: search and AI discovery operations

Updated: 2 November 2026. Canonical property: https://valtumstudio.com.au

## Verified public observations, not rank claims

- Google Search Console: the user reported the public homepage and main service/work
  URLs indexed. The user previously verified 17 URLs discovered via the XML sitemap.
  This does not establish clicks, search queries, or position.
- The canonical site currently serves Google-crawlable HTML, page-specific metadata,
  public breadcrumbs and an Organization identity.
- Independent discovery: Valtum Studio appears on Clutch and The Manifest. Clutch also
  includes Valtum in Australian development category lists. Clutch presently describes
  the studio as “Not yet reviewed” and its industry/client sections are incomplete.
  These are not proof of paid client results or rankings.
- Official business profile references: Australian Business Register, Clutch, The
  Manifest; company social/marketplace profiles supplied by the owner.
- Founder personal LinkedIn is an individual profile, not a company social identity.
  Keep it out of Organization.sameAs.

## Genuine search performance — establish baseline in Google Search Console

1. Open Performance > Search results, select 3 months and the newest complete available
   date range.
2. Record clicks, impressions, CTR, average position; export Query, Page, Country and
   Device tabs.
3. Separate branded queries (Valtum, Valtum Studio, valtumstudio.com.au and
   misspellings) from nonbranded buying questions. Search Console may offer the
   Branded/Non-branded filter if volume allows.
4. Prioritize relevant nonbranded intents: Australian custom software development, SaaS
   development, booking marketplace software, courier management software, computer
   vision workflow software, creative website engineering.
5. Inspect weak CTR only where there are sufficient impressions. Do not optimize based
   on a handful of impressions or single-location incognito tests.
6. Tie enquiry form submission counts and qualified meetings to acquisition channel; do
   not infer profit or leads from search impressions.
7. Never present scraped public Google results as the site's actual GSC rank.

## AI-search discovery and citations

- Google AI Overviews/AI Mode: Google says no special AI-only schema or llms.txt file is
  necessary; indexed people-first content is the foundation.
- OpenAI OAI-SearchBot and Bing: public routes remain crawlable through the default
  robots policy, while /admin, /portal, /auth and private APIs remain disallowed.
- Bing Webmaster Tools: verify the same site, submit the sitemap, inspect AI Performance
  and (if offered) Topics Portfolio. Record citations, cited pages and grounding
  queries, not just raw mentions.
- IndexNow: the root verification file is hosted and a manual, validated bulk submission
  script is provided at scripts/seo/submit-indexnow.mjs. It notifies participating
  engines only; it does not force indexing or affect Google directly.
- No paid placement guarantees, fake reviews, inflated ROI, or invented AI citation
  metrics.

## Weekly AI visibility benchmark prompts

Test a stable question set in logged-out/fresh sessions where possible, record each
search assistant, date, country, exact quoted query, if Valtum was named, if a URL was
linked, citation URL and the actual referral or qualified enquiry.

Branded:

1. What is Valtum Studio, and what software does it build?
2. Is Valtum Studio an Australian registered software business?
3. Which projects are presented by Valtum Studio?
4. How do I contact Valtum Studio?

Unbranded comparison: 5. What Australian studios design custom SaaS platforms and
operational systems? 6. Which software development partners can build a booking
marketplace with inventory holds? 7. Who builds courier dispatch systems with payment
reconciliation? 8. Which studios combine web application engineering with creative
frontend design? 9. Who can build a human-in-the-loop computer vision review
workflow? 10. Which Australia-based creative engineering studios provide complex digital
products?

Do not count model answers without linked evidence as reliable citations. Results can
change with prompts, model versions, location, date and source availability.

## Next evidence-first publications

A. Technical engineering note: Reservation holds, payment webhooks, expiry and
reconciliation. Use the owned Laugh & Lodge repository and verified behaviour. Separate
implemented paths from architectural decisions not yet shipped.

B. Technical engineering note: Human-reviewed computer vision, evidence provenance and
evaluation. Use verifiable Aegis Sentinel code and deployed behaviour. Do not claim
operational accuracy without evaluation data.

C. Studio company information: keep ABN, founder identity, exact public contact channels
and owner-supplied social/marketplace links consistent across site and legitimately
controlled profiles.

Publish only after fact checking product/portfolio claims and client rights. Both
articles need actual diagrams/code excerpts, not generic AI prose.

## Source documentation

- Google AI search guidance:
  https://developers.google.com/search/docs/appearance/ai-features
- Google Organization markup:
  https://developers.google.com/search/docs/appearance/structured-data/organization
- Google Search Console queries: https://support.google.com/webmasters/answer/17010961
- Bing AI Performance:
  https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/
- IndexNow: https://www.indexnow.org/documentation
- Business registry: https://abr.business.gov.au/ABN/View?id=24207947663
