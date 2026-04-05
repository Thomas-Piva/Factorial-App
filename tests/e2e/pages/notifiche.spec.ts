import { test, expect } from "../../fixtures/auth";

test.describe("Notifiche Page", () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto("/notifiche");
    await page.waitForLoadState("networkidle");
  });

  test("should display notifiche page", async ({ authedPage: page }) => {
    await expect(
      page.locator('[data-testid="notifiche-page"]'),
    ).toBeVisible();
  });

  test("should show either notifications list or empty state", async ({
    authedPage: page,
  }) => {
    await expect(
      page.locator(
        '[data-testid="notifiche-list"], [data-testid="notifiche-empty"]',
      ),
    ).toBeVisible({ timeout: 10_000 });
  });
});
