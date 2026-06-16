import { test, expect } from "@playwright/test";
import { mockCoreApis } from "./helpers/mockApi";
import { seedAuth } from "./helpers/auth";
import { waitForWorkspace } from "./helpers/waitForApp";

test.describe("AI Review routes", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoreApis(page);
  });

  test("organizer ai-reviews page renders when enabled", async ({ page }) => {
    test.skip(process.env.VITE_ENABLE_AI_REVIEW === "false", "AI review disabled");
    await seedAuth(page, "organizer");
    await page.route("**/api/v1/admin/events/*/ai-reviews**", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] })
      });
    });
    await page.goto("/organizer/ai-reviews");
    await waitForWorkspace(page, /Đánh giá AI|AI/i);
    await expect(page.locator("body")).toContainText(/đội|cuộc thi/i);
  });
});
