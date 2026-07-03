import { expect, test } from "@playwright/test";
import { mockCoreApis } from "./helpers/mockApi";
import { seedAuth } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await mockCoreApis(page);
});

test("participant ai review route redirects to submission", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.goto("/me/ai-review");
  await expect(page).toHaveURL(/\/me\/submission/);
  await expect(page.locator("body")).toContainText(/repository|nộp bài|bài nộp/i);
});

test("judge scoring filters assignments by term and event", async ({ page }) => {
  await seedAuth(page, "judge");
  await page.goto("/judge/scoring");

  await expect(page.getByLabel("Học kỳ")).toBeVisible();
  await expect(page.getByLabel("Cuộc thi")).toBeVisible();
  await expect(page.locator("body")).toContainText("SEAL Hackathon 2026");

  await page.getByLabel("Học kỳ").selectOption("2");
  await expect(page.getByLabel("Vòng · Bảng")).toHaveValue("2");
  await expect(page.locator("body")).toContainText("Vòng 2 · Bảng B");
});
