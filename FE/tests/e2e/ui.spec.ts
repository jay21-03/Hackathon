import { expect, test } from "@playwright/test";
import { mockCoreApis } from "./helpers/mockApi";
import { seedAuth } from "./helpers/auth";
import { waitForWorkspace } from "./helpers/waitForApp";

test.beforeEach(async ({ page }) => {
  await mockCoreApis(page);
});

test("participant overview shows team from API", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.goto("/me");
  await waitForWorkspace(page, /Đội E2E Alpha|Các bước tiếp theo/i);
  await expect(page.locator("body")).toContainText("Các bước tiếp theo");
});

test("organizer dashboard loads with event selector", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/dashboard");
  await waitForWorkspace(page, "Việc cần làm");
  await expect(page.locator("body")).toContainText("SEAL Hackathon 2026");
});

test("login page renders Google sign-in", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("body")).toContainText("Đăng nhập bằng tài khoản Google");
});

test("phase 7 route redirects to dashboard when feature flag off", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/scoring");
  await expect(page).toHaveURL(/\/organizer\/dashboard/);
  await expect(page.locator("body")).not.toContainText("Chưa kết nối API");
});

test("theme toggle switches html class", async ({ page }) => {
  await page.goto("/login");
  const html = page.locator("html");
  const hadDark = await html.evaluate((el) => el.classList.contains("dark"));
  await page.getByRole("button", { name: /giao diện/i }).click();
  await expect(html).toHaveClass(hadDark ? /^(?!.*dark)/ : /dark/);
});
