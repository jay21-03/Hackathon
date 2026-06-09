import { expect, test } from "@playwright/test";

test("event list uses API data when system API responds", async ({ page }) => {
  await page.route("**/api/v1/events", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "ok",
        data: [
          {
            id: 99,
            name: "API Challenge",
            startDate: "2026-09-01",
            endDate: "2026-09-02",
            registrationStartAt: "2026-08-01T08:00:00+07:00",
            registrationEndAt: "2026-08-25T23:59:00+07:00",
            status: "OPEN"
          }
        ]
      })
    });
  });

  await page.goto("/events");
  await expect(page.getByText("API Challenge")).toBeVisible({ timeout: 15000 });
});

test("event list shows error when API is unavailable", async ({ page }) => {
  await page.route("**/api/v1/events", async (route) => {
    await route.abort("failed");
  });

  await page.goto("/events");
  await expect(page.locator("body")).toContainText(/Không tải được danh sách cuộc thi/i);
});
