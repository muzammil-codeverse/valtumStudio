import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const environment = { ...process.env, VALTUM_SITE_MODE: "frontend" };
for (const args of [
  ["node_modules/prisma/build/index.js", "generate"],
  ["node_modules/next/dist/bin/next", "build"]
]) {
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: environment
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Metadata endpoints are static assets in the public-only export.
const base = (process.env.APP_BASE_URL || "https://valtum-studio.vercel.app").replace(
  /\/$/,
  ""
);
const routes = [
  "/",
  "/work",
  "/solutions",
  "/services",
  "/services/digital-products",
  "/services/websites-and-experiences",
  "/services/intelligent-systems",
  "/services/connected-operations",
  "/approach",
  "/studio",
  "/contact",
  "/privacy",
  "/work/aegis-sentinel",
  "/work/laugh-and-lodge",
  "/work/kt-couriers",
  "/work/math-intellect",
  "/work/personality-assessor"
];
writeFileSync(
  "out/robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`
);
writeFileSync(
  "out/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((path) => `<url><loc>${base}${path}</loc></url>`).join("")}</urlset>`
);
