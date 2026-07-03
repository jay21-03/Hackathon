import { expect, test } from "@playwright/test";
import { seedAuth } from "./helpers/auth";
import { mockCoreApis } from "./helpers/mockApi";

test.beforeEach(async ({ page }) => {
  await mockCoreApis(page);
});

test("organizer ai review filters persist after reload", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.route("**/api/v1/admin/events/*/ai-reviews**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 1,
            teamId: 10,
            teamName: "Đội Alpha",
            reviewKind: "TEAM_AGGREGATE",
            status: "COMPLETED",
            summary: "Ổn",
            reviewedAt: "2026-06-04T10:00:00+07:00"
          },
          {
            id: 2,
            teamId: 20,
            teamName: "Đội Beta",
            reviewKind: "PER_PUSH",
            status: "FAILED",
            summary: "AI_REVIEW_NOT_CONFIGURED",
            reviewedAt: "2026-06-04T11:00:00+07:00"
          }
        ]
      })
    });
  });
  await page.route("**/api/v1/admin/events/*/ai-reviews/health", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          eventId: 1,
          aiConfigured: true,
          schedulerEnabled: true,
          webhookReviewEnabled: true,
          teamsWithRepository: 2,
          teamsWithCompletedReview: 1,
          teamsWithFailedReview: 1,
          teamsPendingReview: 0,
          totalFailedReviews: 1
        }
      })
    });
  });

  await page.goto("/organizer/ai-reviews");
  await page.getByLabel("Lọc trạng thái").selectOption("FAILED");
  await page.getByLabel("Tìm đội").fill("Beta");
  await page.reload();

  await expect(page.getByLabel("Lọc trạng thái")).toHaveValue("FAILED");
  await expect(page.getByLabel("Tìm đội")).toHaveValue("Beta");
  await expect(page.locator("tbody")).toContainText("Đội Beta");
  await expect(page.locator("tbody")).not.toContainText("Đội Alpha");
});

test("judge ai review board and team filters persist after reload", async ({ page }) => {
  await seedAuth(page, "judge");
  await page.route("**/api/v1/judges/boards/*/teams", async (route) => {
    const boardId = Number(new URL(route.request().url()).pathname.match(/boards\/(\d+)\/teams/)?.[1] ?? "0");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data:
          boardId === 2
            ? [{ slotId: 2, slotNumber: 1, teamId: 20, teamName: "Đội Beta", teamStatus: "CONFIRMED" }]
            : [{ slotId: 1, slotNumber: 1, teamId: 10, teamName: "Đội Alpha", teamStatus: "CONFIRMED" }]
      })
    });
  });
  await page.route("**/api/v1/teams/*/ai-review", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: 2,
          teamId: 20,
          teamName: "Đội Beta",
          reviewKind: "PER_PUSH",
          status: "COMPLETED",
          summary: "Đã review"
        }
      })
    });
  });
  await page.route("**/api/v1/teams/*/ai-reviews", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) });
  });

  await page.goto("/judge/ai-review");
  await page.getByLabel(/Vòng.*Bảng/).selectOption("2");
  await page.getByLabel("Đội").selectOption("20");
  await page.reload();

  await expect(page.getByLabel(/Vòng.*Bảng/)).toHaveValue("2");
  await expect(page.getByLabel("Đội")).toHaveValue("20");
  await expect(page).toHaveURL(/boardId=2/);
  await expect(page).toHaveURL(/teamId=20/);
});
