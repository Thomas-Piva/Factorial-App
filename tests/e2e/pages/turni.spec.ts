import { test, expect } from "../../fixtures/auth";

test.describe("Turni Page", () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto("/turni");
    await page.waitForLoadState("networkidle");
  });

  test("should display turni page", async ({ authedPage: page }) => {
    await expect(page.locator('[data-testid="turni-page"]')).toBeVisible();
  });

  test("should show week label", async ({ authedPage: page }) => {
    await expect(page.locator('[data-testid="week-label"]')).toBeVisible();
  });

  test("should show either turni grid or empty state", async ({
    authedPage: page,
  }) => {
    const grid = page.locator('[data-testid="turni-grid"]');
    const empty = page.locator('[data-testid="turni-empty"]');

    // One of the two should be visible
    const gridVisible = await grid.isVisible();
    const emptyVisible = await empty.isVisible();
    expect(gridVisible || emptyVisible).toBe(true);
  });

  test("should take screenshot of turni page", async ({
    authedPage: page,
  }) => {
    await page.screenshot({
      path: "playwright-report/turni-full.png",
      fullPage: true,
    });
  });
});
