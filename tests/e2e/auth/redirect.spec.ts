import { test, expect } from "@playwright/test";

test.describe("Auth Redirects", () => {
  test("should redirect unauthenticated users to /login", async ({ page }) => {
    await page.goto("/home");
    await page.waitForURL("**/login");
    await expect(page.locator("h1")).toContainText("Factorial");
  });

  test("should redirect /calendario to /login when not logged in", async ({
    page,
  }) => {
    await page.goto("/calendario");
    await page.waitForURL("**/login");
  });

  test("should redirect /turni to /login when not logged in", async ({
    page,
  }) => {
    await page.goto("/turni");
    await page.waitForURL("**/login");
  });

  test("should redirect /profilo to /login when not logged in", async ({
    page,
  }) => {
    await page.goto("/profilo");
    await page.waitForURL("**/login");
  });

  test("should redirect root / to /login when not logged in", async ({
    page,
  }) => {
    await page.goto("/");
    // Root could redirect to /login or /home — either way, unauthenticated goes to login
    await page.waitForURL("**/login", { timeout: 10_000 });
  });
});
