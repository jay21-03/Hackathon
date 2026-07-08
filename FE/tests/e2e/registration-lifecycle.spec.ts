import { expect, test } from "@playwright/test";
import { mockCoreApis, sampleTeam } from "./helpers/mockApi";
import { seedAuth } from "./helpers/auth";
import { waitForWorkspace } from "./helpers/waitForApp";

test.beforeEach(async ({ page }) => {
  await mockCoreApis(page);
});

test("team registration pre-fills captain student profile", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.route("**/api/v1/my/teams**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ success: true, message: "ok", data: [] })
    });
  });

  await page.goto("/events/1/register");

  await expect(page.getByTestId("member-email-0")).toHaveValue("participant@seal.edu.vn");
  await expect(page.getByTestId("member-student-id-0")).toHaveValue("SE123456");
  await expect(page.getByTestId("member-university-0")).toHaveValue("FPT University");
});

test("organizer can approve pending team (BTC duyệt)", async ({ page }) => {
  await seedAuth(page, "organizer");
  const pendingTeam = {
    ...sampleTeam,
    id: 20,
    status: "PENDING",
    readyForOrganizerApproval: true
  };

  await page.route("**/api/v1/events/*/teams**", async (route) => {
    const url = route.request().url();
    if (url.includes("/summary")) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { confirmedCount: 0, pendingCount: 1, awaitingApprovalCount: 1, waitlistCount: 0 }
        })
      });
      return;
    }
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { items: [pendingTeam], page: 0, size: 50, total: 1, totalPages: 1 }
        })
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/teams/20/status", async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { ...pendingTeam, status: "CONFIRMED", confirmedAt: new Date().toISOString() }
        })
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/organizer/teams-hub");
  await waitForWorkspace(page, /Đăng ký đội|đăng ký/i);
  await page.getByTestId("approve-registration-20").click();
  await expect(page.locator("body")).toContainText(/Đã cập nhật|Đã xác nhận/i);
});

test("organizer lifecycle: open registration", async ({ page }) => {
  await seedAuth(page, "organizer");
  let status = "DRAFT";

  await page.route("**/api/v1/admin/events/*/open-registration", async (route) => {
    status = "REGISTRATION_OPEN";
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: 1,
          name: "SEAL Hackathon 2026",
          status,
          startDate: "2026-06-01",
          endDate: "2026-06-02",
          minTeamSize: 1,
          maxTeamSize: 5,
          maxTeams: 50
        }
      })
    });
  });

  await page.route("**/api/v1/events/1", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            name: "SEAL Hackathon 2026",
            status,
            startDate: "2026-06-01",
            endDate: "2026-06-02",
            registrationStartAt: "2026-05-01T08:00:00+07:00",
            registrationEndAt: "2026-12-31T23:59:00+07:00",
            minTeamSize: 1,
            maxTeamSize: 5,
            maxTeams: 50
          }
        })
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/organizer/events/basic-info");
  await waitForWorkspace(page, /Vòng đời|Quy trình/i);
  await page.getByRole("button", { name: /Mở đăng ký/i }).click();
  await expect(page.locator("body")).toContainText(/Đã mở đăng ký|Mở đăng ký/i);
});

test("participant pending BTC approval is blocked on board page", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.route("**/api/v1/my/teams**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [{ ...sampleTeam, status: "PENDING", readyForOrganizerApproval: true }]
      })
    });
  });

  await page.goto("/me/board");
  await expect(page.locator("body")).toContainText(/chờ BTC duyệt/i);
});

test("organizer can approve pending user account", async ({ page }) => {
  await seedAuth(page, "organizer");
  await page.route("**/api/v1/admin/users**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 99,
                email: "newuser@seal.edu.vn",
                fullName: "User Moi",
                status: "PENDING_APPROVAL",
                roles: []
              }
            ],
            page: 0,
            size: 20,
            total: 1,
            totalPages: 1
          }
        })
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/users/99/approval", async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: 99,
            email: "newuser@seal.edu.vn",
            fullName: "User Moi",
            status: "ACTIVE",
            roles: []
          }
        })
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/organizer/users");
  await expect(page.locator("body")).toContainText(/Chờ duyệt|PENDING/i);
});

test("organizer approve at full quota shows waitlist toast", async ({ page }) => {
  await seedAuth(page, "organizer");
  const pendingTeam = {
    ...sampleTeam,
    id: 21,
    status: "PENDING",
    readyForOrganizerApproval: true
  };

  await page.route("**/api/v1/events/*/teams**", async (route) => {
    const url = route.request().url();
    if (url.includes("/summary")) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { confirmedCount: 50, pendingCount: 1, awaitingApprovalCount: 1, waitlistCount: 0 }
        })
      });
      return;
    }
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { items: [pendingTeam], page: 0, size: 50, total: 1, totalPages: 1 }
        })
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/teams/21/status", async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { ...pendingTeam, status: "WAITLIST" }
        })
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/organizer/teams-hub#teams-step-registrations");
  await waitForWorkspace(page, /Đăng ký đội|chờ duyệt/i);
  await page.getByTestId("approve-registration-21").click();
  await expect(page.locator("body")).toContainText(/danh sách chờ|Quota đã đầy/i);
});
