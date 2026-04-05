import { test as base, expect, type Page } from "@playwright/test";

/**
 * Credentials for E2E testing — must match a real Supabase user.
 * Set E2E_EMAIL and E2E_PASSWORD env vars to enable authenticated tests.
 */
const TEST_EMAIL = process.env.E2E_EMAIL ?? "";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "";

const hasCredentials = TEST_EMAIL.length > 0 && TEST_PASSWORD.length > 0;

/** Perform login via the login page UI. */
async function loginViaUI(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill(TEST_EMAIL);
  await page.locator("#password").fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  // Wait for redirect to /home after successful login
  await page.waitForURL("**/home", { timeout: 45_000 });
}

/**
 * Extended test fixture that provides an authenticated page.
 * Tests using `authedPage` are automatically skipped when
 * E2E_EMAIL / E2E_PASSWORD are not set.
 */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use, testInfo) => {
    if (!hasCredentials) {
      testInfo.skip(true, "E2E_EMAIL / E2E_PASSWORD not set — skipping auth test");
      return;
    }
    await loginViaUI(page);
    await use(page);
  },
});

export { expect };
