import { expect, type Page } from "@playwright/test";

/** Chờ workspace render xong, không bị redirect 401 về login. */
export async function waitForWorkspace(page: Page, hint: string | RegExp) {
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
  await expect(page.locator("body")).toContainText(hint, { timeout: 10_000 });
}
