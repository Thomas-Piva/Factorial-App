import { test, expect } from "../../fixtures/auth";

test.describe("Bottom Navigation", () => {
  test("should display Home, Calendario, Hub tabs", async ({
    authedPage: page,
  }) => {
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();

    await expect(nav.getByRole("link", { name: /Home/i })).toBeVisible();
    await expect(
      nav.getByRole("link", { name: /Calendario/i }),
    ).toBeVisible();
    await expect(nav.getByRole("link", { name: /Hub/i })).toBeVisible();
  });

  test("should navigate to Calendario", async ({ authedPage: page }) => {
    await page
      .locator("nav")
      .getByRole("link", { name: /Calendario/i })
      .click();
    await page.waitForURL("**/calendario");
    await expect(
      page.locator('[data-testid="calendario-page"]'),
    ).toBeVisible();
  });

  test("should navigate to Hub", async ({ authedPage: page }) => {
    await page.locator("nav").getByRole("link", { name: /Hub/i }).click();
    await page.waitForURL("**/hub");
    await expect(page.locator('[data-testid="hub-page"]')).toBeVisible();
  });

  test("should navigate back to Home", async ({ authedPage: page }) => {
    // Go to Hub first
    await page.locator("nav").getByRole("link", { name: /Hub/i }).click();
    await page.waitForURL("**/hub");

    // Navigate back to Home
    await page.locator("nav").getByRole("link", { name: /Home/i }).click();
    await page.waitForURL("**/home");
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });

  test("should highlight active tab", async ({ authedPage: page }) => {
    // On /home, the Home link should have aria-current="page"
    const homeLink = page.locator('nav a[href="/home"]');
    await expect(homeLink).toHaveAttribute("aria-current", "page");
  });
});
