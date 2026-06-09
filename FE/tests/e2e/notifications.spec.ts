import { expect, test } from "@playwright/test";
import { mockCoreApis, resetMockNotificationState } from "./helpers/mockApi";
import { seedAuth } from "./helpers/auth";
import { waitForWorkspace } from "./helpers/waitForApp";

test.beforeEach(async ({ page }) => {
  resetMockNotificationState();
  await mockCoreApis(page);
});

test("participant notifications page lists items and mark read", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.goto("/me/notifications");
  await waitForWorkspace(page, "Thông báo");

  await expect(page.getByText("Thông báo E2E")).toBeVisible();
  await expect(page.getByRole("button", { name: /Xem chi tiết/i }).first()).toBeVisible();

  const markRead = page.getByRole("button", { name: "Đánh dấu đã đọc" }).first();
  if (await markRead.isVisible()) {
    await markRead.click();
    await expect(page.getByText("Đã đọc").first()).toBeVisible();
  }
});

test("participant sidebar notifications nav shows unread badge", async ({ page }) => {
  await seedAuth(page, "participant");
  const unreadPromise = page.waitForResponse((res) => res.url().includes("/me/notifications/unread-count"));
  await page.goto("/me");
  await unreadPromise;
  await waitForWorkspace(page, "Tổng quan");

  const nav = page.getByRole("link", { name: /Thông báo/i });
  await expect(nav).toBeVisible();
  await expect(nav.locator("span.bg-error")).toBeVisible({ timeout: 10_000 });
});

test("organizer can send announcement from announcements page", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/announcements");
  await waitForWorkspace(page, "Thông báo chung");

  await page.getByPlaceholder("Ví dụ: Cập nhật lịch nộp bài").fill("E2E smoke announcement");
  await page.getByPlaceholder("Nội dung chi tiết gửi tới người tham gia cuộc thi…").fill(
    "Playwright E2E — phase 9"
  );
  await page.getByRole("button", { name: "Gửi thông báo" }).click();

  await expect(page.getByText("E2E smoke announcement")).toBeVisible();
  await expect(page.locator("body")).toContainText(/2 người nhận|Đã tạo thông báo/i);
});

test("organizer notifications center route renders", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/notifications");
  await expect(page.locator("body")).toContainText(/Thông báo/i);
});
