import { expect, test } from "@playwright/test";
import { mockCoreApis } from "./helpers/mockApi";
import { mockCommitWebSocket } from "./helpers/mockCommitWebSocket";
import { seedAuth } from "./helpers/auth";
import { waitForWorkspace } from "./helpers/waitForApp";

test.describe("UX polish smoke", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoreApis(page);
    await mockCommitWebSocket(page);
  });

  test("judge scoring page renders with board selector", async ({ page }) => {
    await seedAuth(page, "judge");
    await page.goto("/judge/scoring");
    await waitForWorkspace(page, /Danh sách đội/i);
    await expect(page.getByRole("heading", { name: "Danh sách đội" })).toBeVisible();
  });

  test("participant announcements route", async ({ page }) => {
    await seedAuth(page, "participant");
    await page.goto("/me/announcements");
    await expect(page.getByText(/Thông báo|Chưa có thông báo/i).first()).toBeVisible();
  });

  test("organizer dashboard shows scheduler health", async ({ page }) => {
    await seedAuth(page, "organizer");
    await page.goto("/organizer/dashboard");
    await waitForWorkspace(page, /Scheduler nền tảng|Đội đã xác nhận/i);
    await expect(page.getByText("Scheduler nền tảng")).toBeVisible();
  });

  test("mobile viewport judge scoring", async ({ page }) => {
    await seedAuth(page, "judge");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/judge/scoring");
    await waitForWorkspace(page, /Danh sách đội/i);
    await expect(page.getByRole("heading", { name: "Danh sách đội" })).toBeVisible();
  });
});
