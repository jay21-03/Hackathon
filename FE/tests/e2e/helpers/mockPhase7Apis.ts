import type { Page } from "@playwright/test";

function ok<T>(data: T) {
  return { success: true, message: "ok", data };
}

export async function mockPhase7Apis(page: Page) {
  await page.route("**/api/v1/admin/events/*/advancements**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(
          ok({
            fromRoundId: 1,
            toRoundId: 2,
            topNPerBoard: 2,
            candidates: []
          })
        )
      });
      return;
    }
    await route.continue();
  });
}
