import { expect, test } from "@playwright/test";
import { DEMO_ORGANIZER_EMAIL, login, waitForBackend } from "./helpers/liveApi";

const live = process.env.LIVE_STACK === "1";

test.describe("live API health", () => {
  test.skip(!live, "Set LIVE_STACK=1 with Postgres+BE on :8085");

  test("backend health and organizer login", async ({ request }) => {
    await waitForBackend(60_000);
    const session = await login(request, DEMO_ORGANIZER_EMAIL);
    expect(session.token).toBeTruthy();
    expect(session.roles.map((r) => r.toUpperCase())).toContain("ORGANIZER");
  });

  test("public events list returns seeded event", async ({ request }) => {
    const response = await request.get("/api/v1/events");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const events = body.data as Array<{ id: number; name: string }>;
    expect(events.some((event) => event.id === 11)).toBeTruthy();
  });
});
