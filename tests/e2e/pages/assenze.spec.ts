import { test, expect } from "../../fixtures/auth";

test.describe("Assenze Page", () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto("/assenze");
    await page.waitForLoadState("networkidle");
  });

  test("should display assenze page", async ({ authedPage: page }) => {
    await expect(page.locator('[data-testid="assenze-page"]')).toBeVisible();
  });

  test("should show either assenze list or empty state", async ({
    authedPage: page,
  }) => {
    // Wait for data to load — either list or empty state will appear
    await expect(
      page.locator(
        '[data-testid="assenze-list"], [data-testid="assenze-empty"]',
      ),
    ).toBeVisible({ timeout: 10_000 });
  });
});
