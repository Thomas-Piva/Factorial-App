import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("should display login form", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Factorial");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText(
      "Accedi",
    );
  });

  test("should show error for empty email", async ({ page }) => {
    await page.locator("#password").fill("anypassword");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('p[role="alert"]')).toContainText(
      "Email obbligatoria",
    );
  });

  test("should show error for empty password", async ({ page }) => {
    await page.locator("#email").fill("test@example.com");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('p[role="alert"]')).toContainText(
      "Password obbligatoria",
    );
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.locator("#email").fill("wrong@example.com");
    await page.locator("#password").fill("wrongpassword");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('p[role="alert"]')).toContainText(
      "Credenziali non valide",
    );
  });

  test("should show loading state during submission", async ({ page }) => {
    await page.locator("#email").fill("test@example.com");
    await page.locator("#password").fill("password123");

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Button should show loading text while request is in-flight
    await expect(submitBtn).toContainText("Accesso in corso");
  });
});
