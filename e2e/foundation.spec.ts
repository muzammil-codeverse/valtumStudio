import { expect, test } from "@playwright/test";

test("approved Valtum Studio pages and system health remain reachable", async ({
  page,
  request
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /good ideas\.\s*beautifully built\./i
    })
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("link", { name: /explore our work/i }).first()
  ).toBeVisible();

  const healthResponse = await request.get("/api/health");
  expect(healthResponse.status()).toBe(200);
  expect(await healthResponse.json()).toMatchObject({
    service: "valtum-studio-web",
    status: "ok"
  });

  await page.goto("/work");
  await expect(
    page.getByRole("heading", { level: 1, name: /the work,\s*in context/i })
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Go directly to a case study" })
      .getByRole("link")
  ).toHaveCount(5);

  await page.goto("/work/aegis-sentinel");
  await expect(page.locator("#main-content")).toBeVisible();

  await page.goto("/does-not-exist");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /this page\s*has moved\s*out of view/i
    })
  ).toBeVisible();
});

test("headings use one color and the footer excludes Fiverr", async ({ page }) => {
  test.setTimeout(150_000);
  await page.emulateMedia({ reducedMotion: "reduce" });

  const publicPaths = [
    "/",
    "/work",
    "/work/aegis-sentinel",
    "/services",
    "/solutions",
    "/approach",
    "/studio",
    "/blog",
    "/blog/before-you-commission-custom-software",
    "/contact",
    "/privacy",
    "/cookies",
    "/does-not-exist"
  ];

  async function expectSingleColorHeadings(): Promise<void> {
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    const mixedHeadings = await page
      .locator("h1, h2, h3, h4, h5, h6, [role='heading']")
      .evaluateAll((headings) =>
        headings.flatMap((heading) => {
          const color = getComputedStyle(heading).color;
          return Array.from(heading.querySelectorAll("*"))
            .filter(
              (fragment) =>
                Array.from(fragment.childNodes).some(
                  (node) =>
                    node.nodeType === Node.TEXT_NODE &&
                    Boolean(node.textContent?.trim())
                ) && getComputedStyle(fragment).color !== color
            )
            .map((fragment) => fragment.textContent?.trim());
        })
      );
    expect(mixedHeadings).toEqual([]);
  }

  for (const path of publicPaths) {
    await page.goto(path);
    await expectSingleColorHeadings();
    const footer = page.locator("footer.v-footer");
    await expect(footer).toHaveCount(1);
    await expect(footer.getByRole("link", { name: /fiverr/i })).toHaveCount(0);
    await expect(footer.getByRole("link", { name: /linkedin/i })).toHaveCount(1);
    const inviteColors = await footer
      .locator(".v-footer-invite a")
      .evaluate((link) => ({
        base: getComputedStyle(link).color,
        emphasis: getComputedStyle(link.querySelector("em") ?? link).color
      }));
    expect(inviteColors.emphasis).toBe(inviteColors.base);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expectSingleColorHeadings();

  await page.goto("/auth/sign-in");
  await expectSingleColorHeadings();
});
