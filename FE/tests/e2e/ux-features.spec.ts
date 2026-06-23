import { expect, test } from "@playwright/test";
import { mockCommitWebSocket } from "./helpers/mockCommitWebSocket";
import { mockCoreApis } from "./helpers/mockApi";
import { mockRepoProvisioningApis, sampleProvisionedRepo } from "./helpers/mockRepoApis";
import { seedAuth } from "./helpers/auth";
import { waitForWorkspace } from "./helpers/waitForApp";

function ok<T>(data: T) {
  return { success: true, message: "ok", data };
}

const levelDescriptors = [
  { level: "EXCELLENT", label: "Xuất sắc", minScore: 9, maxScore: 10, description: "E2E" },
  { level: "GOOD", label: "Tốt", minScore: 7, maxScore: 8.9, description: "E2E" },
  { level: "SATISFACTORY", label: "Đạt", minScore: 5, maxScore: 6.9, description: "E2E" },
  { level: "UNSATISFACTORY", label: "Chưa đạt", minScore: 0, maxScore: 4.9, description: "E2E" }
];

const sourceRubric = {
  roundId: 2,
  criteria: [
    {
      id: 11,
      code: "R2_01",
      name: "Tiêu chí kế thừa E2E",
      weight: 100,
      minScore: 0,
      maxScore: 10,
      sortOrder: 1,
      levelDescriptors
    }
  ],
  totalWeight: 100,
  locked: false
};

const carryoverTerms = [
  {
    id: 1,
    code: "SPRING_2026",
    name: "Spring 2026",
    year: 2026,
    termType: "SPRING",
    startDate: "2026-01-01",
    endDate: "2026-05-31",
    status: "ACTIVE",
    eventCount: 1
  },
  {
    id: 2,
    code: "FALL_2025",
    name: "Fall 2025",
    year: 2025,
    termType: "FALL",
    startDate: "2025-09-01",
    endDate: "2025-12-31",
    status: "ARCHIVED",
    eventCount: 0
  }
];

const carryoverJudge = {
  id: 42,
  email: "judge.carryover@seal.edu.vn",
  fullName: "GK Carryover E2E"
};

test.beforeEach(async ({ page }) => {
  await mockCoreApis(page);
  await mockRepoProvisioningApis(page);
  await mockCommitWebSocket(page);
});

test("staff carryover lists judges from source term and applies selection", async ({ page }) => {
  await page.route("**/api/v1/admin/academic-terms**", async (route) => {
    const url = route.request().url();
    if (route.request().method() === "GET" && /\/academic-terms(\?|$)/.test(url)) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(ok(carryoverTerms))
      });
      return;
    }
    if (route.request().method() === "GET" && /\/academic-terms\/2\/judges(\?|$)/.test(url)) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(
          ok({
            academicTerm: { id: 2, code: "FALL_2025", name: "Fall 2025" },
            items: [carryoverJudge],
            totalElements: 1,
            page: 0,
            size: 100,
            totalPages: 1
          })
        )
      });
      return;
    }
    if (route.request().method() === "GET" && /\/academic-terms\/2\/mentors(\?|$)/.test(url)) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(
          ok({
            academicTerm: { id: 2, code: "FALL_2025", name: "Fall 2025" },
            items: [],
            totalElements: 0,
            page: 0,
            size: 100,
            totalPages: 0
          })
        )
      });
      return;
    }
    if (route.request().method() === "GET" && /\/academic-terms\/1\/judges\/candidates/.test(url)) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(
          ok({
            academicTerm: { id: 1, code: "SPRING_2026", name: "Spring 2026" },
            items: [],
            totalElements: 0,
            page: 0,
            size: 100,
            totalPages: 0
          })
        )
      });
      return;
    }
    if (route.request().method() === "GET" && /\/academic-terms\/1\/mentors\/candidates/.test(url)) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(
          ok({
            academicTerm: { id: 1, code: "SPRING_2026", name: "Spring 2026" },
            items: [],
            totalElements: 0,
            page: 0,
            size: 100,
            totalPages: 0
          })
        )
      });
      return;
    }
    await route.fallback();
  });

  let carryoverPosted = false;
  await page.route("**/api/v1/events/*/staff-carryover**", async (route) => {
    carryoverPosted = true;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(
        ok({
          total: 1,
          succeededCount: 1,
          failedCount: 0,
          succeeded: [{ userId: carryoverJudge.id, email: carryoverJudge.email, role: "JUDGE" }],
          failed: []
        })
      )
    });
  });

  await seedAuth(page, "organizer");
  await page.goto("/organizer/staff#staff-step-carryover");
  await waitForWorkspace(page, /Chuyển staff|Học kỳ nguồn/i);
  await expect(page.getByText(carryoverJudge.fullName)).toBeVisible();

  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "Chuyển đã chọn" }).click();
  await expect(page.getByText(/Đã chuyển 1 người/i)).toBeVisible();
  expect(carryoverPosted).toBe(true);
});

test("rubric setup inherits criterion from source round", async ({ page }) => {
  const rounds = [
    {
      id: 1,
      eventId: 1,
      name: "Vòng 1",
      roundType: "MAIN",
      roundOrder: 1,
      startAt: "2026-06-01T08:00:00+07:00",
      endAt: "2026-06-01T18:00:00+07:00",
      status: "ACTIVE"
    },
    {
      id: 2,
      eventId: 1,
      name: "Vòng 2",
      roundType: "MAIN",
      roundOrder: 2,
      startAt: "2026-06-02T08:00:00+07:00",
      endAt: "2026-06-02T18:00:00+07:00",
      status: "DRAFT"
    }
  ];

  await page.unroute("**/api/v1/admin/events/*/rounds**");
  await page.route("**/api/v1/admin/events/*/rounds**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(ok(rounds))
      });
      return;
    }
    await route.continue();
  });

  await page.unroute("**/api/v1/admin/rounds/*/criteria**");
  await page.route("**/api/v1/admin/rounds/*/criteria**", async (route) => {
    const url = route.request().url();
    if (route.request().method() === "GET" && url.includes("/rounds/2/")) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(ok(sourceRubric))
      });
      return;
    }
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(
          ok({
            roundId: 1,
            criteria: [
              {
                id: 1,
                code: "R1_01",
                name: "Ý tưởng",
                weight: 100,
                minScore: 0,
                maxScore: 10,
                sortOrder: 1,
                levelDescriptors
              }
            ],
            totalWeight: 100,
            locked: false
          })
        )
      });
      return;
    }
    await route.continue();
  });

  await seedAuth(page, "organizer");
  await page.goto("/organizer/boards#board-step-rubric");
  await waitForWorkspace(page, /Kế thừa từ vòng|Tiêu chí chấm/i);

  await page.getByLabel("Kế thừa từ vòng").selectOption({ label: "Vòng 1" });
  await page.getByRole("button", { name: "Kế thừa" }).first().click();
  await expect(page.getByText(/Đã kế thừa tiêu chí/i)).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Tên tiêu chí" })).toHaveValue("Ý tưởng");
});

test("submission management shows commit connection badge when connected", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/artifacts-hub#artifacts-step-submissions");
  await waitForWorkspace(page, /Bài nộp|Danh sách bài nộp/i);
  await expect(page.getByText("Commit thời gian thực").first()).toBeVisible({ timeout: 10_000 });
});

test("repository list shows aggregate stats from API", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/artifacts-hub#artifacts-step-repositories");
  await waitForWorkspace(page, /Danh sách repository|Org \/ user GitHub|Repository đội thi/i);
  await expect(page.getByText(sampleProvisionedRepo.teamName!)).toBeVisible();
  await expect(page.getByText(/1 repository/i)).toBeVisible();
  const statsPanel = page.locator("aside").filter({ hasText: "Thống kê (bảng đang chọn)" });
  await expect(statsPanel.locator("dt", { hasText: "Tổng repo" }).locator("..").locator("dd")).toHaveText("1");
  await expect(statsPanel.locator("dt", { hasText: "Đang mở" }).locator("..").locator("dd")).toHaveText("1");
  await expect(statsPanel.locator("dt", { hasText: "Đã khóa" }).locator("..").locator("dd")).toHaveText("0");
  await expect(statsPanel.locator("dt", { hasText: "Lỗi" }).locator("..").locator("dd")).toHaveText("0");
});
