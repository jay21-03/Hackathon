import { expect, test } from "@playwright/test";

const live = process.env.LIVE_STACK === "1";
const jwt = process.env.LIVE_STACK_JWT?.trim() ?? "";

function authHeaders() {
  return jwt ? { Authorization: `Bearer ${jwt}` } : {};
}

test.describe("live stack", () => {
  test.skip(!live, "Set LIVE_STACK=1 with BE on :8085 to run");

  test("public events API responds", async ({ request }) => {
    const response = await request.get("/api/v1/events");
    expect(response.status()).toBeLessThan(500);
    const body = await response.json();
    expect(body).toHaveProperty("success");
  });

  test("admin publish-readiness requires auth", async ({ request }) => {
    const response = await request.get("/api/v1/admin/events/1/publish-readiness");
    expect([401, 403]).toContain(response.status());
  });

  test("paged submissions when JWT provided", async ({ request }) => {
    test.skip(!jwt, "Set LIVE_STACK_JWT for authorized API checks");
    const events = await request.get("/api/v1/events");
    const eventsBody = await events.json();
    const eventId = eventsBody?.data?.[0]?.id;
    test.skip(!eventId, "No events in DB");
    const response = await request.get(
      `/api/v1/admin/events/${eventId}/submissions?page=0&size=10`,
      { headers: authHeaders() }
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveProperty("items");
    expect(body.data).toHaveProperty("total");
  });

  test("paged staff invitations when JWT provided", async ({ request }) => {
    test.skip(!jwt, "Set LIVE_STACK_JWT for authorized API checks");
    const events = await request.get("/api/v1/events");
    const eventId = (await events.json())?.data?.[0]?.id;
    test.skip(!eventId, "No events in DB");
    const response = await request.get(
      `/api/v1/events/${eventId}/staff-invitations?page=0&size=5`,
      { headers: authHeaders() }
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveProperty("items");
    expect(body.data).toHaveProperty("total");
  });

  test("publish-readiness when JWT provided", async ({ request }) => {
    test.skip(!jwt, "Set LIVE_STACK_JWT for authorized API checks");
    const events = await request.get("/api/v1/events");
    const eventId = (await events.json())?.data?.[0]?.id;
    test.skip(!eventId, "No events in DB");
    const response = await request.get(`/api/v1/admin/events/${eventId}/publish-readiness`, {
      headers: authHeaders()
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveProperty("ready");
  });

  test("organizer scoring page loads against real API", async ({ page }) => {
    await page.goto("/organizer/results-hub#results-step-scoring");
    await expect(page).toHaveURL(/\/login/);
  });
});
