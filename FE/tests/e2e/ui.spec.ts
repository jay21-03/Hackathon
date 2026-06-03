import { expect, test, type Page } from "@playwright/test";

type Role = "participant" | "organizer" | "mentor" | "judge";

const roleProfiles: Record<Role, { role: Role; email: string; name: string }> = {
  participant: {
    role: "participant",
    email: "participant@seal.edu.vn",
    name: "Thi sinh demo"
  },
  organizer: {
    role: "organizer",
    email: "organizer@seal.edu.vn",
    name: "Ban to chuc demo"
  },
  mentor: {
    role: "mentor",
    email: "mentor@seal.edu.vn",
    name: "Mentor demo"
  },
  judge: {
    role: "judge",
    email: "judge@seal.edu.vn",
    name: "Giam khao demo"
  }
};

async function useRole(page: Page, role: Role) {
  await page.addInitScript((profile: (typeof roleProfiles)[Role]) => {
    window.localStorage.setItem("seal.demo.session", JSON.stringify(profile));
  }, roleProfiles[role]);
}

test("participant dashboard shows actionable overview UI", async ({ page }) => {
  await useRole(page, "participant");
  await page.goto("/me");
  await expect(page.getByRole("heading", { name: "Quantum Nexus" })).toBeVisible();
  await expect(page.locator("body")).toContainText("Tien do san sang");
  await expect(page.locator("body")).toContainText("Danh gia AI");
  await expect(page.locator("body")).toContainText("Xep hang chi tinh diem da chot");
});

test("team page shows member confirmation and submission entry point", async ({ page }) => {
  await useRole(page, "participant");
  await page.goto("/me/team");
  await expect(page.locator("body")).toContainText("Thanh vien");
  await expect(page.locator("body")).toContainText("Alex Nguyen");
  await expect(page.getByRole("link", { name: /Cap nhat bai nop/i })).toBeVisible();
});

test("organizer dashboard shows operational cards and next actions", async ({ page }) => {
  await useRole(page, "organizer");
  await page.goto("/organizer/dashboard");
  await expect(page.getByRole("heading", { name: "SEAL Hackathon 2026" })).toBeVisible();
  await expect(page.locator("body")).toContainText("Quota dang ky");
  await expect(page.locator("body")).toContainText("Can xu ly tiep");
  await expect(page.locator("body")).toContainText("Thu tu van hanh cuoc thi");
  await expect(page.locator("body")).toContainText("Ket qua chua cong khai");
  await expect(page.locator("body")).toContainText("Dang ky va phan cong");
  await expect(page.getByRole("link", { name: /Cong bo ket qua/i }).first()).toHaveAttribute("href", "/organizer/publish-results");
});

test("workspace shell exposes full participant navigation", async ({ page }) => {
  await useRole(page, "participant");
  await page.goto("/me");
  await expect(page.getByRole("link", { name: /Bai nop/i }).first()).toBeVisible();
  await page.getByRole("link", { name: /Bai nop/i }).first().click();
  await expect(page).toHaveURL(/\/me\/submission$/);
});

test("organizer remaining React pages render key UI", async ({ page }) => {
  await useRole(page, "organizer");
  const checks: Array<[string, string]> = [
    ["/organizer/users", "Phan quyen he thong"],
    ["/organizer/boards", "Quan ly bang cham"],
    ["/organizer/invitations", "Theo doi trang thai loi moi"],
    ["/organizer/finals", "Chon doi vao chung ket"],
    ["/organizer/disqualifications", "Loai doi khi co vi pham"],
    ["/organizer/announcements", "Quan ly noi dung thong bao"]
  ];

  for (const [path, text] of checks) {
    await page.goto(path);
    await expect(page.locator("body")).toContainText(text);
    await expect(page.locator("body")).not.toContainText(/backend|telemetry|pipeline|gateway|operator|mock/i);
  }
});

test("participant remaining React pages render key UI", async ({ page }) => {
  await useRole(page, "participant");
  const checks: Array<[string, string]> = [
    ["/me/status", "Trang thai doi"],
    ["/me/board", "Bang thi"],
    ["/me/ai-review", "Khong tinh xep hang"]
  ];

  for (const [path, text] of checks) {
    await page.goto(path);
    await expect(page.locator("body")).toContainText(text);
    await expect(page.locator("body")).not.toContainText(/backend|telemetry|pipeline|gateway|operator|mock/i);
  }
});

test("organizer table density mode switches labels", async ({ page }) => {
  await useRole(page, "organizer");
  await page.goto("/organizer/users");
  await page.getByRole("button", { name: "Gon" }).click();
  await expect(page.getByRole("button", { name: "Gon" })).toHaveClass(/bg-primary-container/);
});

test("role pages do not create horizontal overflow", async ({ page }) => {
  await useRole(page, "organizer");
  const paths = [
    "/organizer/events",
    "/organizer/registrations",
    "/organizer/users",
    "/organizer/ranking",
    "/organizer/publish-results"
  ];

  for (const path of paths) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} should not overflow horizontally`).toBeLessThanOrEqual(2);
  }
});

test("core routes avoid prototype and internal wording", async ({ page }) => {
  const checks: Array<[Role | "public", string]> = [
    ["public", "/events/1/results"],
    ["participant", "/me"],
    ["participant", "/me/submission"],
    ["organizer", "/organizer/dashboard"],
    ["organizer", "/organizer/scoring"],
    ["organizer", "/organizer/publish-results"],
    ["mentor", "/mentor/dashboard"],
    ["judge", "/judge/scoring"]
  ];

  for (const [role, path] of checks) {
    if (role !== "public") {
      await page.goto("/events");
      await page.evaluate((profile) => {
        window.localStorage.setItem("seal.demo.session", JSON.stringify(profile));
      }, roleProfiles[role]);
    }
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText(
      /AI Review|score sheet|public portal|backend|mock|pipeline|gateway|operator|telemetry/i
    );
  }
});
