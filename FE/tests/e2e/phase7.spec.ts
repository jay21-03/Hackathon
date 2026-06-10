import { expect, test } from "@playwright/test";
import { mockCoreApis } from "./helpers/mockApi";
import { mockAcademicTermApis } from "./helpers/mockAcademicTermApis";
import { mockPhase7Apis } from "./helpers/mockPhase7Apis";
import { seedAuth } from "./helpers/auth";
import { waitForWorkspace } from "./helpers/waitForApp";

test.beforeEach(async ({ page }) => {
  await mockCoreApis(page);
  await mockAcademicTermApis(page);
  await mockPhase7Apis(page);
});

test("organizer can open finals advancement page", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/results-hub#results-step-finals");
  await waitForWorkspace(page, /Chung kết|Vòng/i);
  await expect(page.locator("body")).toContainText(/Chung kết|Vòng/i);
});

test("academic term page shows scoped resource tabs", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/academic-terms");
  await waitForWorkspace(page, /Học kỳ/i);
  await expect(page.locator("body")).toContainText("Tổng quan học kỳ");
  await page.getByRole("button", { name: "Nhân sự" }).click();
  await page.getByRole("button", { name: "Thí sinh" }).click();
  await expect.poll(async () => page.locator("body").innerText()).toContain("Nguyễn Văn A");
});
