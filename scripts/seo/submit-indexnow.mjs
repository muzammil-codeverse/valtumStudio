/**
 * Notify IndexNow participants of updated canonical public pages.
 *
 * Usage:
 *   node scripts/seo/submit-indexnow.mjs --dry-run
 *   node scripts/seo/submit-indexnow.mjs
 *
 * Run only when the production sitemap has changed or important pages were updated.
 * This is not a Google Search indexing API and submission does not guarantee indexing.
 */
const origin = "https://valtumstudio.com.au";
const host = new URL(origin).hostname;
const key = "3377a9b318028a7703880389b8b29a94";
const keyLocation = `${origin}/${key}.txt`;
const dryRun = process.argv.includes("--dry-run");

const response = await fetch(`${origin}/sitemap.xml`, {
  headers: { Accept: "application/xml" },
  signal: AbortSignal.timeout(20000)
});

if (!response.ok) {
  throw new Error(`Could not read the production sitemap: HTTP ${response.status}`);
}

const xml = await response.text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => match[1]?.trim())
  .filter((value) => typeof value === "string")
  .map((value) => new URL(value))
  .filter(
    (url) =>
      url.protocol === "https:" &&
      url.hostname === host &&
      !url.search &&
      !url.hash
  )
  .map((url) => url.toString());

const urlList = [...new Set(urls)];
if (urlList.length === 0 || urlList.length > 10000) {
  throw new Error("Invalid public sitemap URL count. Refusing submission.");
}

const body = { host, key, keyLocation, urlList };
if (dryRun) {
  console.log(JSON.stringify({ dryRun, count: urlList.length, urlList }, null, 2));
  process.exit(0);
}

const submit = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(20000)
});
const responseText = (await submit.text()).slice(0, 500);
console.log(
  JSON.stringify({
    httpStatus: submit.status,
    submittedCount: urlList.length,
    response: responseText
  })
);
if (submit.status !== 200 && submit.status !== 202) {
  process.exitCode = 1;
}
