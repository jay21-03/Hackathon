import { expect, test } from "@playwright/test";
import { waitForWorkspace } from "../helpers/waitForApp";
import {
  DEMO_ORGANIZER_EMAIL,
  DEMO_PENDING_TEAM_ID,
  closeEventRegistration,
  fetchTeamSummary,
  login
} from "./helpers/liveApi";

const live = process.env.LIVE_STACK === "1";

test.describe("live registration lifecycle", () => {
  test.skip(!live, "Set LIVE_STACK=1 with Postgres+BE on :8085/:5433 and seed");

  test.use({ storageState: "tests/e2e/live/.auth/organizer.json" });

  test("organizer approves pending team (BTC duyệt)", async ({ page, request }) => {
    const session = await login(request, DEMO_ORGANIZER_EMAIL);
    const before = await fetchTeamSummary(request, session.token);
    expect(before.awaitingApprovalCount).toBeGreaterThanOrEqual(1);

    await page.goto("/organizer/teams-hub#teams-step-registrations");
    await waitForWorkspace(page, /Đăng ký đội|chờ duyệt/i);

    const approveButton = page.getByTestId(`approve-registration-${DEMO_PENDING_TEAM_ID}`);
    await expect(approveButton).toBeEnabled({ timeout: 15_000 });
    await approveButton.click();

    await expect.poll(async () => page.locator("body").innerText()).toMatch(/Đã cập nhật|Đã xác nhận/i);

    const after = await fetchTeamSummary(request, session.token);
    expect(after.confirmedCount).toBeGreaterThan(before.confirmedCount);
    expect(after.awaitingApprovalCount).toBeLessThan(before.awaitingApprovalCount);
  });

  test("organizer opens registration after close (vòng đời)", async ({ page, request }) => {
    const session = await login(request, DEMO_ORGANIZER_EMAIL);
    await closeEventRegistration(request, session.token);

    await page.goto("/organizer/events/basic-info");
    await waitForWorkspace(page, /Vòng đời|Quy trình/i);
    await expect(page.getByRole("button", { name: /Mở đăng ký/i })).toBeVisible();
    await page.getByRole("button", { name: /Mở đăng ký/i }).click();

    await expect.poll(async () => page.locator("body").innerText()).toMatch(/Đang mở đăng ký|Mở đăng ký/i);
  });

  test("team summary reflects demo seed counts", async ({ request }) => {
    const session = await login(request, DEMO_ORGANIZER_EMAIL);
    const summary = await fetchTeamSummary(request, session.token);
    expect(summary.confirmedCount).toBeGreaterThanOrEqual(1);
    expect(summary.awaitingApprovalCount).toBeGreaterThanOrEqual(0);
  });
});
