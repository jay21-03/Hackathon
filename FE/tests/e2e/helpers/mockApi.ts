import type { Page } from "@playwright/test";

const sampleEvent = {
  id: 1,
  name: "SEAL Hackathon 2026",
  startDate: "2026-06-01",
  endDate: "2026-06-02",
  registrationStartAt: "2026-05-01T08:00:00+07:00",
  registrationEndAt: "2026-05-31T23:59:00+07:00",
  status: "OPEN"
};

const sampleTeam = {
  id: 10,
  eventId: 1,
  name: "Đội E2E Alpha",
  status: "CONFIRMED",
  members: [
    {
      id: 101,
      email: "captain@seal.edu.vn",
      fullName: "Nguyễn Văn A",
      status: "CONFIRMED",
      contactPerson: true
    }
  ]
};

function ok<T>(data: T) {
  return { success: true, message: "ok", data };
}

/** Mock API tối thiểu để E2E chạy không cần backend. */
export async function mockCoreApis(page: Page) {
  await page.route("**/api/v1/events**", async (route) => {
    const url = route.request().url();
    if (route.request().method() === "GET" && /\/events\/\d+$/.test(url)) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(
          ok({
            ...sampleEvent,
            minTeamSize: 1,
            maxTeamSize: 5,
            maxTeams: 50
          })
        )
      });
      return;
    }
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(ok([sampleEvent]))
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/my/teams**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(ok([sampleTeam]))
    });
  });

  await page.route("**/api/v1/events/1/teams**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(ok([sampleTeam]))
    });
  });

  await page.route("**/api/v1/admin/events/1/rounds**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(
        ok([
          {
            id: 1,
            eventId: 1,
            name: "Vòng 1",
            roundType: "MAIN",
            roundOrder: 1,
            startAt: "2026-06-01T08:00:00+07:00",
            endAt: "2026-06-01T18:00:00+07:00",
            status: "ACTIVE"
          }
        ])
      )
    });
  });

  await page.route("**/api/v1/rounds/1/countdown**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(ok({ status: "RUNNING", remainingSeconds: 3600 }))
    });
  });

  await page.route("**/api/v1/admin/users**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(
        ok([
          {
            id: 1,
            email: "organizer@seal.edu.vn",
            fullName: "Organizer",
            status: "ACTIVE",
            roles: ["ORGANIZER"],
            createdAt: "2026-01-01T00:00:00+07:00"
          }
        ])
      )
    });
  });

  await page.route("**/api/v1/admin/rounds/**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(ok([]))
    });
  });
}
