import { expect, test } from "@playwright/test";
import { waitForWorkspace } from "../helpers/waitForApp";
import {
  DEMO_EVENT_ID,
  DEMO_FROM_ROUND_ID,
  DEMO_TO_ROUND_ID,
  DEMO_ORGANIZER_EMAIL,
  fetchAdvancementPreview,
  login
} from "./helpers/liveApi";

const live = process.env.LIVE_STACK === "1";

test.describe("live organizer core flows", () => {
  test.skip(!live, "Set LIVE_STACK=1 with Postgres+BE on :8085/:5433");

  test.use({ storageState: "tests/e2e/live/.auth/organizer.json" });

  test("event wizard shows setup steps from real data", async ({ page }) => {
    await page.goto("/organizer/events/wizard");
    await waitForWorkspace(page, /Quy trình vận hành|Thiết lập cuộc thi/i);
    await expect(page.locator("body")).toContainText("Thông tin");
    await expect(page.locator("body")).toContainText("Đội & lời mời");
    await page.getByRole("button", { name: "Đội & lời mời" }).click();
    await expect(page.locator("body")).toContainText("Đăng ký đội");
  });

  test("academic term panel loads scoped tabs from API", async ({ page }) => {
    await page.goto("/organizer/academic-terms");
    await waitForWorkspace(page, /Học kỳ/i);
    await page.getByRole("button", { name: "Theo dõi kỳ" }).click();
    await expect(page.locator("body")).toContainText("Tổng quan học kỳ");

    await page.getByRole("button", { name: "Cuộc thi & đội" }).click();
    await page.getByRole("button", { name: "Cuộc thi", exact: true }).click();
    await expect.poll(async () => page.locator("body").innerText()).toMatch(/SEAL Hackathon|Hackathon/i);

    await page.getByRole("button", { name: "Nhân sự" }).click();
    await page.getByRole("button", { name: "Thí sinh" }).click();
    await expect.poll(async () => page.locator("body").innerText()).toMatch(/Quantum Nexus|participant@seal/i);

    await page.getByRole("button", { name: "Mentor" }).click();
    await expect.poll(async () => page.locator("body").innerText()).toContain("mentor@seal.edu.vn");

    await page.getByRole("button", { name: "Giám khảo" }).click();
    await expect.poll(async () => page.locator("body").innerText()).toContain("judge@seal.edu.vn");

    await page.getByRole("button", { name: "Kết quả & kỹ thuật" }).click();
    await page.getByRole("button", { name: "Xếp hạng" }).click();
    await expect.poll(async () => page.locator("body").innerText()).toMatch(/Quantum Nexus|đội #/i);
  });

  test("finals page previews and executes advancement against live API", async ({ page, request }) => {
    const session = await login(request, DEMO_ORGANIZER_EMAIL);
    const preview = await fetchAdvancementPreview(request, session.token);
    expect(preview.candidates.length).toBeGreaterThan(0);

    const existing = await request.get(
      `/api/v1/admin/events/${DEMO_EVENT_ID}/advancements?toRoundId=${DEMO_TO_ROUND_ID}`,
      { headers: { Authorization: `Bearer ${session.token}` } }
    );
    const existingBody = await existing.json();
    const alreadyAdvanced = (existingBody?.data?.length ?? 0) > 0;

    await page.goto("/organizer/results-hub#results-step-finals");
    await waitForWorkspace(page, /Chung kết|chuyển đội/i);

    await page.locator("select").nth(0).selectOption(String(DEMO_FROM_ROUND_ID));
    await page.locator("select").nth(1).selectOption(String(DEMO_TO_ROUND_ID));

    await expect.poll(async () => page.locator("body").innerText()).toContain(preview.candidates[0].teamName);

    if (!alreadyAdvanced) {
      await page.getByRole("button", { name: "Thực hiện chuyển đội" }).click();
      await page.getByRole("button", { name: "Chuyển đội" }).click();
    }

    await expect.poll(async () => page.locator("body").innerText()).toMatch(
      new RegExp(`${preview.candidates[0].teamName}|Đã chuyển`, "i")
    );
  });
});
