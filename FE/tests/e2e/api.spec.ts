import { expect, test } from "@playwright/test";

test("event list uses API data when system API responds", async ({ page }) => {
  await page.route("**/api/v1/events", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: 99,
            name: "API Challenge",
            startDate: "2026-09-01T08:00:00+07:00",
            endDate: "2026-09-02T18:00:00+07:00",
            registrationStartAt: "2026-08-01T08:00:00+07:00",
            registrationEndAt: "2026-08-25T23:59:00+07:00",
            status: "OPEN"
          }
        ]
      })
    });
  });

  await page.goto("/events");
  await expect(page.locator("body")).toContainText("API Challenge");
  await expect(page.locator("body")).not.toContainText("Dang hien thi du lieu minh hoa");
});

test("event list falls back when system API is unavailable", async ({ page }) => {
  await page.route("**/api/v1/events", async (route) => {
    await route.abort("failed");
  });

  await page.goto("/events");
  await expect(page.locator("body")).toContainText("SEAL Hackathon 2026");
  await expect(page.locator("body")).toContainText("Dang hien thi du lieu minh hoa");
});
