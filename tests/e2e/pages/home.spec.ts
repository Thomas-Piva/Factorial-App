import { test, expect } from "../../fixtures/auth";

test.describe("Home Page", () => {
  test("should load home page after login", async ({ authedPage: page }) => {
    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });

  test("should display greeting section", async ({ authedPage: page }) => {
    // The home page has a greeting section with user info
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("should take full-page screenshot", async ({ authedPage: page }) => {
    await page.screenshot({
      path: "playwright-report/home-full.png",
      fullPage: true,
    });
  });
});
