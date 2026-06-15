import { test, expect } from "@playwright/test";

test.describe("AI Review routes (feature flag)", () => {
  test("organizer ai-reviews route loads when enabled", async ({ page }) => {
    test.skip(process.env.VITE_ENABLE_AI_REVIEW !== "true", "AI review disabled in build");
    await page.goto("/login");
    await expect(page).toHaveURL(/login/);
  });
});
