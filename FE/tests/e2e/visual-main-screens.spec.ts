import { expect, test, type Page } from "@playwright/test";
import { mockCoreApis } from "./helpers/mockApi";
import { mockRepoProvisioningApis } from "./helpers/mockRepoApis";
import { seedAuth, type E2ERole } from "./helpers/auth";

async function expectUsableViewport(page: Page) {
  await page.waitForLoadState("networkidle");
  const screenshot = await page.screenshot({ fullPage: true, animations: "disabled" });
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

async function openAs(page: Page, role: E2ERole, path: string) {
  await mockCoreApis(page);
  await mockRepoProvisioningApis(page);
  await seedAuth(page, role);
  await page.goto(path);
}

const desktopScreens: Array<{ role: E2ERole; path: string; name: string }> = [
  { role: "organizer", path: "/organizer/dashboard", name: "BTC overview" },
  { role: "organizer", path: "/organizer/boards", name: "board management" },
  { role: "organizer", path: "/organizer/board-ops", name: "board operations" },
  { role: "organizer", path: "/organizer/ai-reviews", name: "AI review" },
  { role: "judge", path: "/judge/scoring", name: "judge scoring" },
  { role: "participant", path: "/me/submission", name: "participant submission" }
];

for (const screen of desktopScreens) {
  test(`visual desktop: ${screen.name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openAs(page, screen.role, screen.path);
    await expectUsableViewport(page);
  });
}

test("visual mobile: judge scoring modal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openAs(page, "judge", "/judge/scoring");
  await page.getByRole("button", { name: /Chấm điểm/i }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectUsableViewport(page);
});

test("visual tablet: board operations table", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await openAs(page, "organizer", "/organizer/board-ops");
  await expectUsableViewport(page);
});
