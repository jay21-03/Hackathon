import { expect, test } from "@playwright/test";
import { mockCoreApis } from "./helpers/mockApi";
import { seedAuth } from "./helpers/auth";
import { waitForWorkspace } from "./helpers/waitForApp";

test.beforeEach(async ({ page }) => {
  await mockCoreApis(page);
});

test("participant can submit via manual repository link when provisioning is disabled", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.goto("/me/submission");
  await waitForWorkspace(page, "Bài nộp");
  await expect(page.getByPlaceholder("https://github.com/org/repo")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/chưa có GitHub username hợp lệ/i);
});
