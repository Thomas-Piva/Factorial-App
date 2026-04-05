import { test, expect } from "../../fixtures/auth";

test.describe("Persone Page", () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto("/persone");
    await page.waitForLoadState("networkidle");
  });

  test("should display persone page", async ({ authedPage: page }) => {
    await expect(page.locator('[data-testid="persone-page"]')).toBeVisible();
  });

  test("should show either people list or empty state", async ({
    authedPage: page,
  }) => {
    await expect(
      page.locator(
        '[data-testid="persone-list"], [data-testid="persone-empty"]',
      ),
    ).toBeVisible({ timeout: 10_000 });
  });
});
