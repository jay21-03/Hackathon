import type { Page } from "@playwright/test";

function ok<T>(data: T) {
  return { success: true, message: "ok", data };
}

export async function mockPhase7Apis(page: Page) {
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
      name: "Chung kết",
      roundType: "FINAL",
      roundOrder: 2,
      startAt: "2026-06-02T08:00:00+07:00",
      endAt: "2026-06-02T18:00:00+07:00",
      status: "DRAFT"
    }
  ];

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

  await page.route("**/api/v1/events/*/rounds**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(ok(rounds))
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/events/*/advancements**", async (route) => {
    const url = route.request().url();
    if (route.request().method() === "GET") {
      if (url.includes("/advancements/preview")) {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify(
            ok({
              fromRoundId: 1,
              toRoundId: 2,
              topNPerBoard: 2,
              candidates: [],
              eligibleTeams: []
            })
          )
        });
        return;
      }
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(ok([]))
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/events/*/award-categories**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(ok([]))
    });
  });

  await page.route("**/api/v1/admin/events/*/awards**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(
          ok({
            eventId: 1,
            eventName: "SEAL Hackathon 2026",
            published: false,
            publishedAt: null,
            categories: []
          })
        )
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(
        ok({
          suggestions: [],
          created: 0,
          message: "ok"
        })
      )
    });
  });
}
