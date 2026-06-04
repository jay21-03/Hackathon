import { expect, test } from "@playwright/test";
import { mockCoreApis } from "./helpers/mockApi";
import { seedAuth } from "./helpers/auth";
import { waitForWorkspace } from "./helpers/waitForApp";

test.beforeEach(async ({ page }) => {
  await mockCoreApis(page);
});

test("organizer can open create event form", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/events/new");
  await expect(page.getByRole("heading", { name: "Tạo cuộc thi mới" })).toBeVisible();
  await expect(page.locator("body")).toContainText("Tên cuộc thi");
});

test("organizer edit page shows integrated setup steps", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/events/basic-info");
  await waitForWorkspace(page, "Quy trình thiết lập");
  await expect(page.locator("body")).toContainText("Thông tin");
});

test("participant problem page waits for backend API", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.goto("/me/problem");
  await expect(page.locator("body")).toContainText(/Đề thi|Chưa sẵn sàng|API/i);
});

test("organizer registrations page renders", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.route("**/api/v1/events/1/teams**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ success: true, message: "ok", data: [] })
    });
  });
  await page.goto("/organizer/registrations");
  await expect(page.locator("body")).toContainText(/Duyệt đăng ký|đăng ký/i);
});
