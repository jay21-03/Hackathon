import { expect, test } from "@playwright/test";
import { mockCoreApis } from "./helpers/mockApi";
import { seedAuth } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await mockCoreApis(page);
});

test("participant overview shows team from API", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.goto("/me");
  await expect(page.getByRole("heading", { name: "Đội E2E Alpha" })).toBeVisible();
  await expect(page.locator("body")).toContainText("Thứ tự cần hoàn thành");
});

test("organizer dashboard loads with event selector", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/dashboard");
  await expect(page.locator("body")).toContainText("SEAL Hackathon 2026");
  await expect(page.locator("body")).toContainText("Tổng quan ban tổ chức");
});

test("login page renders Google sign-in", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("body")).toContainText("Đăng nhập bằng tài khoản Google");
});

test("phase 7 page shows unavailable state without mock wording", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/scoring");
  await expect(page.locator("body")).toContainText("Chưa kết nối API");
  await expect(page.locator("body")).not.toContainText(/mock|minh hoa/i);
});

test("theme toggle switches html class", async ({ page }) => {
  await page.goto("/login");
  const html = page.locator("html");
  const hadDark = await html.evaluate((el) => el.classList.contains("dark"));
  await page.getByRole("button", { name: /giao diện/i }).click();
  await expect(html).toHaveClass(hadDark ? /^(?!.*dark)/ : /dark/);
});
