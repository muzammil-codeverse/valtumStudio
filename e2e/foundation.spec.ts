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

test("hero cards rotate continuously through all five projects", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const cards = page.locator(".h-hero-card");
  const front = page.locator('.h-hero-card[data-slot="front"]');
  const next = page.getByRole("button", { name: "Next project" });
  await expect(cards).toHaveCount(5);
  await expect(front).toHaveAttribute("href", "/work/aegis-sentinel");
  await next.click();
  await expect(front).toHaveAttribute("href", "/work/laugh-and-lodge");
  await expect
    .poll(() => front.evaluate((card) => card.getAnimations().length))
    .toBeGreaterThan(0);
  await expect
    .poll(() =>
      front.evaluate((card) => getComputedStyle(card).getPropertyValue("--hero-card-x"))
    )
    .toBe("0%");

  for (const slug of [
    "math-intellect",
    "kt-couriers",
    "personality-assessor",
    "aegis-sentinel"
  ]) {
    await next.click();
    await expect(front).toHaveAttribute("href", "/work/" + slug);
    await expect(cards).toHaveCount(5);
  }
  await page.getByRole("button", { name: "Previous project" }).click();
  await expect(front).toHaveAttribute("href", "/work/personality-assessor");
  await front.focus();
  await front.press("ArrowRight");
  await expect(front).toHaveAttribute("href", "/work/aegis-sentinel");
  await expect(front).toBeFocused();
});

test("shared media takeover expands during entry and keeps its final copy", async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/services");
  await page.waitForLoadState("networkidle");
  const scene = page.locator("[data-takeover]").first();
  const media = scene.locator(".m-takeover-media");
  const copy = scene.locator(".m-takeover-copy");
  const mask = () =>
    media.evaluate((element) => {
      const value = getComputedStyle(element).clipPath;
      return Number.parseFloat(value.replace("inset(", ""));
    });
  await expect.poll(mask).toBeGreaterThan(10);
  await scene.evaluate((element) => {
    window.scrollTo(
      0,
      window.scrollY + element.getBoundingClientRect().top - innerHeight * 0.4
    );
  });
  await expect.poll(mask).toBeLessThan(14);
  expect(await mask()).toBeGreaterThan(0);
  await expect(media).toBeVisible();

  await scene.evaluate((element) => {
    window.scrollTo(
      0,
      window.scrollY + element.getBoundingClientRect().bottom - innerHeight
    );
  });
  await expect.poll(mask).toBeLessThan(0.5);
  await expect
    .poll(() => copy.evaluate((element) => Number(getComputedStyle(element).opacity)))
    .toBeGreaterThan(0.95);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(copy).toBeVisible();
  await expect(media).toHaveCSS("clip-path", "none");
});
