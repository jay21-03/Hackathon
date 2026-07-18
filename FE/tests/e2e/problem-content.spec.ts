import { test, expect } from "@playwright/test";
import { mockCoreApis } from "./helpers/mockApi";
import { seedAuth } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await mockCoreApis(page);
});

test("organizer problem page shows content editor and attachment fields", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/board-ops");

  await expect(page.getByText("Nội dung đề")).toBeVisible();
  await expect(page.getByText("Xem trước — giao diện thí sinh")).toBeVisible();
  await expect(page.getByText("Tệp đính kèm (PDF / DOCX / ZIP)")).toBeVisible();
  await expect(page.getByPlaceholder("https://drive.google.com/...")).toBeVisible();
  await expect(page.getByRole("button", { name: /Cập nhật đề|Tạo đề thi/ })).toBeVisible();
});

test("participant problem page shows rich content and links", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.goto("/me/problem");

  await expect(page.getByText("Đề E2E")).toBeVisible();
  await expect(page.getByText("rich text")).toBeVisible();
  await expect(page.getByRole("link", { name: /Link tham khảo/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Tải tệp đính kèm/ })).toBeVisible();
  await expect(page.getByText(/Rubric/i)).toBeVisible();
  await expect(page.getByText("100%")).toBeVisible();
  await expect(page.getByText("0-10")).toBeVisible();
  await expect(page.getByText("E2E").first()).toBeVisible();
});
