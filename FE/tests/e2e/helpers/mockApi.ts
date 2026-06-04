import type { Page } from "@playwright/test";

const sampleEvent = {
  id: 1,
  name: "SEAL Hackathon 2026",
  startDate: "2026-06-01",
  endDate: "2026-06-02",
  registrationStartAt: "2026-05-01T08:00:00+07:00",
  registrationEndAt: "2026-05-31T23:59:00+07:00",
  status: "REGISTRATION_OPEN"
};

const sampleRound = {
  id: 1,
  eventId: 1,
  name: "Vòng 1",
  roundType: "MAIN",
  roundOrder: 1,
  startAt: "2026-06-01T08:00:00+07:00",
  endAt: "2026-06-01T18:00:00+07:00",
  status: "ACTIVE"
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

const eventDetail = {
  ...sampleEvent,
  minTeamSize: 1,
  maxTeamSize: 5,
  maxTeams: 50,
  description: "E2E event"
};

function ok<T>(data: T) {
  return { success: true, message: "ok", data };
}

function json(route: import("@playwright/test").Route, data: unknown) {
  return route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(data)
  });
}

/**
 * Mock API cho E2E — không cần backend.
 * Route đăng ký sau được ưu tiên trước (Playwright reverse order).
 */
export async function mockCoreApis(page: Page) {
  // Fallback thấp nhất — tránh 401 redirect về /login
  await page.route("**/api/**", async (route) => {
    if (route.request().method() === "GET") {
      await json(route, ok([]));
      return;
    }
    await json(route, ok(null));
  });

  await page.route("**/api/v1/me**", async (route) => {
    await json(
      route,
      ok({
        id: 1,
        email: "organizer@seal.edu.vn",
        fullName: "Ban tổ chức E2E",
        status: "ACTIVE",
        roles: ["ORGANIZER", "PARTICIPANT", "MENTOR", "JUDGE"]
      })
    );
  });

  await page.route("**/api/v1/my/board**", async (route) => {
    await json(
      route,
      ok({
        assigned: true,
        boardId: 1,
        boardName: "Bảng A",
        slotNumber: 3,
        roundId: 1
      })
    );
  });

  await page.route("**/api/v1/my/problem**", async (route) => {
    await json(route, ok({ available: false, reason: "NOT_RELEASED" }));
  });

  await page.route("**/api/v1/my/teams**", async (route) => {
    await json(route, ok([sampleTeam]));
  });

  await page.route("**/api/v1/rounds/*/countdown**", async (route) => {
    await json(route, ok({ status: "RUNNING", remainingSeconds: 3600 }));
  });

  await page.route("**/api/v1/events/*/rounds**", async (route) => {
    if (route.request().method() === "GET") {
      await json(route, ok([sampleRound]));
    } else {
      await route.continue();
    }
  });

  await page.route("**/api/v1/events/*/teams**", async (route) => {
    if (route.request().method() === "GET") {
      await json(route, ok([sampleTeam]));
    } else {
      await route.continue();
    }
  });

  await page.route("**/api/v1/events/*", async (route) => {
    const url = route.request().url();
    if (route.request().method() === "GET" && /\/events\/\d+(\?|$)/.test(url)) {
      await json(route, ok(eventDetail));
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/events**", async (route) => {
    if (route.request().method() === "GET") {
      await json(route, ok([sampleEvent]));
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/events/*/rounds**", async (route) => {
    if (route.request().method() === "GET") {
      await json(route, ok([sampleRound]));
    } else {
      await route.continue();
    }
  });

  await page.route("**/api/v1/admin/events/*", async (route) => {
    const url = route.request().url();
    if (route.request().method() === "GET" && /\/admin\/events\/\d+(\?|$)/.test(url)) {
      await json(route, ok(eventDetail));
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/users**", async (route) => {
    await json(
      route,
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
    );
  });

  await page.route("**/api/v1/admin/rounds/**", async (route) => {
    await json(route, ok([]));
  });

  await page.route("**/api/v1/admin/boards/**", async (route) => {
    await json(route, ok([]));
  });
}
