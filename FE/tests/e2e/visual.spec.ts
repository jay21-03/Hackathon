import { expect, test, type Page } from "@playwright/test";
import { mockCoreApis } from "./helpers/mockApi";
import { seedAuth } from "./helpers/auth";

async function expectStableScreenshot(page: Page) {
  const screenshot = await page.screenshot({
    fullPage: true,
    animations: "disabled"
  });
  expect(screenshot.byteLength).toBeGreaterThan(8_000);

  const metrics = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.scrollHeight,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }));
  expect(metrics.width).toBeGreaterThan(300);
  expect(metrics.height).toBeGreaterThan(200);
  expect(metrics.overflow).toBeLessThanOrEqual(4);
}

test.beforeEach(async ({ page }) => {
  await mockCoreApis(page);
});

test("events discovery layout is stable", async ({ page }) => {
  await page.goto("/events");
  await expect(page.locator("body")).toContainText("SEAL");
  await expectStableScreenshot(page);
});

test("login layout is stable", async ({ page }) => {
  await page.goto("/login");
  await expectStableScreenshot(page);
});

test("organizer dashboard layout is stable", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/dashboard");
  await expectStableScreenshot(page);
});
