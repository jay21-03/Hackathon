import { expect, test } from "@playwright/test";
import { mockCoreApis } from "./helpers/mockApi";
import { mockRepoProvisioningApis, sampleProvisionedRepo, sampleRepoTemplate } from "./helpers/mockRepoApis";
import { seedAuth } from "./helpers/auth";
import { waitForWorkspace } from "./helpers/waitForApp";

test.beforeEach(async ({ page }) => {
  await mockCoreApis(page);
  await mockRepoProvisioningApis(page);
});

test("organizer repository page shows template form and provisioned list", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/artifacts-hub#artifacts-step-repositories");
  await waitForWorkspace(page, /Bài nộp & (mã nguồn|repository)|Repository đội thi|Org \/ user GitHub/i);
  await expect(page.locator("body")).toContainText("Org / user GitHub");
  await expect(page.locator("body")).toContainText("Cấp repo ngay");
  await expect(page.locator("body")).toContainText(sampleProvisionedRepo.teamName!);
  await expect(page.locator("body")).toContainText("Đang mở");
});

test("organizer can save repo template from repository page", async ({ page }) => {
  let saved = false;
  await page.route("**/api/v1/admin/problems/*/repo-template**", async (route) => {
    if (route.request().method() === "PUT") {
      saved = true;
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "ok",
          data: {
            id: 1,
            problemId: 1,
            templateOwner: "my-org",
            templateRepo: "starter",
            defaultBranch: "main",
            enabled: true
          }
        })
      });
      return;
    }
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "ok", data: sampleRepoTemplate })
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ success: true, message: "ok", data: null })
    });
  });

  await seedAuth(page, "organizer");
  await page.goto("/organizer/artifacts-hub#artifacts-step-repositories");
  await waitForWorkspace(page, /Org \/ user GitHub|Cấp repo ngay/i);

  await page.getByPlaceholder("my-org").fill("my-org");
  await page.getByPlaceholder("hackathon-starter").fill("starter");
  await page.getByRole("button", { name: /Cập nhật mẫu|Tạo mẫu/i }).click();

  await expect.poll(() => saved).toBe(true);
});

test("organizer board management shows github template section on problem step", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/boards#board-step-problem");
  await waitForWorkspace(page, /Mẫu repository GitHub|Đề E2E Repo/i);
  await expect(page.locator("body")).toContainText("Mẫu repository GitHub");
  await expect(page.getByRole("link", { name: "Quản lý repository" })).toBeVisible();
});

test("participant submission page shows provisioned repository", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.goto("/me/submission");
  await waitForWorkspace(page, "Bài nộp");
  await expect(page.locator("body")).toContainText(/Repository đã cấp|Đang mở/i);
  await expect(page.getByRole("link", { name: sampleProvisionedRepo.githubRepoName! })).toBeVisible();
});

test("participant can save github username on profile", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.goto("/profile");
  await waitForWorkspace(page, /Hồ sơ|GitHub username/i);

  await page.getByPlaceholder("ten-tai-khoan-github").fill("e2e-github-user");
  await page.getByRole("button", { name: /Lưu hồ sơ/i }).click();

  await expect(page.locator("body")).toContainText(/Đã lưu hồ sơ/i);
});

test("participant without github username sees profile reminder on submission page", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.goto("/me/submission");
  await waitForWorkspace(page, "Bài nộp");
  await expect(page.locator("body")).toContainText(/chưa có GitHub username hợp lệ/i);
  await expect(page.getByRole("link", { name: /Cập nhật hồ sơ/i })).toBeVisible();
});
