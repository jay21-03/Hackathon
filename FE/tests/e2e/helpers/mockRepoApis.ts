import type { Page } from "@playwright/test";

function ok<T>(data: T) {
  return { success: true, message: "ok", data };
}

function json(route: import("@playwright/test").Route, data: unknown) {
  return route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(data)
  });
}

export const sampleProblem = {
  id: 1,
  boardId: 1,
  title: "Đề E2E Repo",
  description: "<p>Mô tả đề</p>",
  attachmentUrl: "/api/v1/files/problems/1/mock-de.pdf",
  externalLink: "https://drive.google.com/file/d/mock/view",
  releaseAt: "2026-06-01T08:00:00+07:00",
  closeAt: "2026-12-31T23:59:00+07:00"
};

export const sampleRepoTemplate = {
  id: 1,
  problemId: 1,
  templateOwner: "seal-org",
  templateRepo: "hackathon-starter",
  defaultBranch: "main",
  enabled: true
};

export const sampleProvisionedRepo = {
  id: 501,
  teamId: 10,
  teamName: "Đội E2E Alpha",
  roundId: 1,
  boardId: 1,
  problemId: 1,
  repositoryUrl: "https://github.com/seal-org/seal-event-1-team-10-problem-1",
  repositoryName: "seal-event-1-team-10-problem-1",
  githubOwner: "seal-org",
  githubRepoName: "seal-event-1-team-10-problem-1",
  accessStatus: "OPEN",
  provisionStatus: "CREATED",
  lastError: null
};

/** Mock API phục vụ trang repository GitHub — đăng ký sau mockCoreApis. */
export async function mockRepoProvisioningApis(page: Page) {
  await page.route("**/api/v1/admin/boards/*/problems**", async (route) => {
    if (route.request().method() === "GET") {
      await json(route, ok([sampleProblem]));
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/rounds/*/repositories/lock**", async (route) => {
    if (route.request().method() === "POST") {
      await json(
        route,
        ok({
          roundId: 1,
          totalRepositories: 1,
          lockedCount: 1,
          failedCount: 0,
          repositories: [{ ...sampleProvisionedRepo, accessStatus: "CLOSED" }]
        })
      );
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/team-repositories/*/retry**", async (route) => {
    if (route.request().method() === "POST") {
      await json(route, ok({ repository: sampleProvisionedRepo }));
      return;
    }
    await route.continue();
  });

}
