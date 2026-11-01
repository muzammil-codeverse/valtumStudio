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
