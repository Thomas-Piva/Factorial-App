import { test, expect } from "../../fixtures/auth";

test.describe("Profilo Page", () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto("/profilo");
    await page.waitForLoadState("networkidle");
  });

  test("should display profilo page", async ({ authedPage: page }) => {
    await expect(page.locator('[data-testid="profilo-page"]')).toBeVisible();
  });

  test("should have edit button", async ({ authedPage: page }) => {
    await expect(
      page.locator('[data-testid="profilo-edit-btn"]'),
    ).toBeVisible();
  });

  test("should toggle edit form when clicking edit button", async ({
    authedPage: page,
  }) => {
    // Form should not be visible initially
    await expect(
      page.locator('[data-testid="profilo-form"]'),
    ).not.toBeVisible();

    // Click edit
    await page.locator('[data-testid="profilo-edit-btn"]').click();

    // Form should appear
    await expect(page.locator('[data-testid="profilo-form"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="profilo-save-btn"]'),
    ).toBeVisible();
  });
});
