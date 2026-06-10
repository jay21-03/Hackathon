import { expect, test } from "@playwright/test";
import { mockCoreApis } from "./helpers/mockApi";
import { mockRepoProvisioningApis, sampleProvisionedRepo } from "./helpers/mockRepoApis";
import { seedAuth } from "./helpers/auth";
import { waitForWorkspace } from "./helpers/waitForApp";

test.beforeEach(async ({ page }) => {
  await mockCoreApis(page);
  await mockRepoProvisioningApis(page);
});

test("organizer repository page shows template form and provisioned list", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/artifacts-hub#artifacts-step-repositories");
  await waitForWorkspace(page, /Bài nộp & repository|Repository đội thi/i);
  await expect(page.locator("body")).toContainText("Template owner");
  await expect(page.locator("body")).toContainText("Provision ngay");
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
    await route.continue();
  });

  await seedAuth(page, "organizer");
  await page.goto("/organizer/artifacts-hub#artifacts-step-repositories");
  await waitForWorkspace(page, "Template owner");

  await page.getByPlaceholder("my-org").fill("my-org");
  await page.getByPlaceholder("hackathon-starter").fill("starter");
  await page.getByRole("button", { name: /Cập nhật mẫu|Tạo mẫu/i }).click();

  await expect.poll(() => saved).toBe(true);
});

test("organizer problems page shows github template section", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/board-ops");
  await waitForWorkspace(page, /Đề thi theo bảng|Mẫu repository GitHub/i);
  await expect(page.locator("body")).toContainText("Mẫu repository GitHub");
  await expect(page.getByRole("link", { name: "Quản lý repository" })).toBeVisible();
});

test("participant submission page shows provisioned repository", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.goto("/me/submission");
  await waitForWorkspace(page, "Bài nộp");
  await expect(page.locator("body")).toContainText("Repository đã cấp");
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

test("participant without github flag still reaches submission via manual link", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.goto("/me/submission");
  await waitForWorkspace(page, "Bài nộp");
  await expect(page.getByPlaceholder("https://github.com/org/repo")).toBeVisible();
});
