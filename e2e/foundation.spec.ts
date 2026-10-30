import { expect, test } from "@playwright/test";

test("foundation routes are available with an accessible light-only baseline", async ({
  page,
  request
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Clarity from complexity." })
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)"
  );

  const healthResponse = await request.get("/api/health");
  expect(healthResponse.status()).toBe(200);
  expect(await healthResponse.json()).toMatchObject({
    service: "valtum-studio-web",
    status: "ok"
  });

  await page.goto("/does-not-exist");
  await expect(
    page.getByRole("heading", { level: 1, name: "Page not found" })
  ).toBeVisible();
});
