import { expect, test } from "@playwright/test";
import { mockCoreApis, sampleTeam } from "./helpers/mockApi";
import { seedAuth } from "./helpers/auth";
import { waitForWorkspace } from "./helpers/waitForApp";

test.beforeEach(async ({ page }) => {
  await mockCoreApis(page);
});

test("organizer can open create event form", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.goto("/organizer/events/new");
  await waitForWorkspace(page, "Tạo cuộc thi mới");
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

test("organizer phase 7 submissions page renders", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.route("**/api/v1/admin/events/*/submissions**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "ok",
        data: {
          items: [
            {
              teamId: 1,
              teamName: "Đội Alpha",
              boardId: 10,
              boardName: "Bảng A",
              slotNumber: 1,
              status: "SUBMITTED",
              repositoryUrl: "https://github.com/org/repo",
              repositoryName: "repo",
              submittedAt: "2026-06-01T10:00:00Z"
            }
          ],
          page: 0,
          size: 50,
          total: 1,
          totalPages: 1
        }
      })
    });
  });
  await page.goto("/organizer/submissions");
  await expect(page.locator("body")).toContainText(/Bài nộp|Đã nộp/i);
});

test("organizer registrations page renders", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.route("**/api/v1/events/1/teams**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "ok",
          data: { items: [], page: 0, size: 50, total: 0, totalPages: 0 }
        })
      });
      return;
    }
    await route.continue();
  });
  await page.goto("/organizer/registrations");
  await expect(page.locator("body")).toContainText(/Duyệt đăng ký|đăng ký/i);
});

test("publish results page shows readiness blockers", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.route("**/api/v1/admin/events/*/publish-readiness**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "ok",
        data: {
          eventId: 1,
          ready: false,
          blockers: ["Chưa có bảng nào được tính xếp hạng."],
          boards: []
        }
      })
    });
  });
  await page.goto("/organizer/publish-results");
  await expect(page.locator("body")).toContainText(/Chưa đủ điều kiện công bố/i);
});

test("captain can cancel pending team invitation", async ({ page }) => {
  await seedAuth(page, "participant");
  let currentTeam = {
    ...sampleTeam,
    status: "PENDING",
    members: [
      {
        id: 101,
        email: "participant@seal.edu.vn",
        fullName: "Đội trưởng",
        status: "CONFIRMED",
        contactPerson: true
      },
      {
        id: 102,
        email: "member@seal.edu.vn",
        fullName: "Thành viên mời",
        status: "INVITED",
        contactPerson: false
      }
    ]
  };

  await page.route("**/api/v1/my/teams**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ success: true, message: "ok", data: [currentTeam] })
    });
  });

  await page.route("**/api/v1/teams/10/members/102", async (route) => {
    if (route.request().method() === "DELETE") {
      currentTeam = { ...currentTeam, members: [currentTeam.members[0]] };
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "ok", data: currentTeam })
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/me/team");
  await waitForWorkspace(page, "Đội của tôi");
  await page.getByRole("button", { name: "Huỷ mời" }).click();
  await expect(page.locator("body")).toContainText("Thành viên: 1/5");
});

test("judge can accept staff invitation when logged in", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.route("**/api/v1/staff-invitations/accept", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "ok",
        data: {
          id: 50,
          boardId: 10,
          boardName: "Bảng A",
          email: "participant@seal.edu.vn",
          role: "JUDGE",
          status: "ACCEPTED"
        }
      })
    });
  });
  await page.route("**/api/v1/me**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "ok",
        data: {
          id: 1,
          email: "participant@seal.edu.vn",
          fullName: "Giám khảo mới",
          roles: ["JUDGE"]
        }
      })
    });
  });

  await page.goto("/staff-invitations/accept?token=board-10-invite-50-abc");
  await expect(page.locator("body")).toContainText(/Bảng A|Giám khảo/i);
  await expect(page.getByRole("link", { name: "Vào không gian làm việc" })).toBeVisible();
});

test("participant workflow shows results step after publish", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.route("**/api/v1/events/1/results**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "ok",
        data: { published: true, boards: [{ boardId: 10, boardName: "Bảng A", entries: [] }] }
      })
    });
  });

  await page.goto("/me");
  await waitForWorkspace(page, "Đội E2E Alpha");
  await expect(page.locator("body")).toContainText("Kết quả");
});
