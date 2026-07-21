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
  await waitForWorkspace(page, "Đội đã xác nhận");
  await expect(page.locator("body")).toContainText("SEAL Hackathon 2026");
});

test("login page renders auth shell", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("body")).toContainText("Đăng nhập SEAL Hackathon");
  await expect(page.locator("body")).toContainText("Quên mật khẩu?");
});

test("login shows validation error for invalid email", async ({ page }) => {
  await page.goto("/login");
  const emailInput = page.getByPlaceholder("you@example.com");
  await emailInput.fill("not-an-email");
  await page.getByPlaceholder("Mật khẩu").fill("short");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(emailInput).toHaveJSProperty("validity.valid", false);
});

test("create event shows validation when end date is before start date", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/events/new");
  await page.getByLabel(/Tên cuộc thi/i).fill("E2E Event");
  await page.locator('input[type="date"]').nth(0).fill("2026-12-10");
  await page.locator('input[type="date"]').nth(1).fill("2026-12-01");
  await page.locator('input[type="datetime-local"]').nth(0).fill("2026-12-01T08:00");
  await page.locator('input[type="datetime-local"]').nth(1).fill("2026-12-05T23:59");
  await page.getByRole("button", { name: "Tạo cuộc thi" }).click();
  await expect(page.locator("body")).toContainText("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
});

test("signup shows validation error for weak password", async ({ page }) => {
  await page.goto("/login/signup");
  await page.getByPlaceholder("you@gmail.com").fill("user@example.com");
  await page.locator('input[placeholder="Mật khẩu"]').fill("weak");
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page.locator("body")).toContainText("Mật khẩu cần");
});

test("submission page loads with API data", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.goto("/me/submission");
  await waitForWorkspace(page, "Bài nộp");
  await expect(page.locator("body")).toContainText("Bản nháp");
  await expect(page.locator("body")).toContainText(/seal\/e2e-demo|repository GitHub/i);
});

test("scoring progress page loads with API data", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/results-hub#results-step-scoring");
  await waitForWorkspace(page, "Tiến độ chấm");
  await expect(page.locator("body")).toContainText("Đội E2E Alpha");
});

test("theme toggle switches html class", async ({ page }) => {
  await page.goto("/login");
  const html = page.locator("html");
  const hadDark = await html.evaluate((el) => el.classList.contains("dark"));
  await page.getByRole("button", { name: /giao diện/i }).click();
  await expect(html).toHaveClass(hadDark ? /^(?!.*dark)/ : /dark/);
});
