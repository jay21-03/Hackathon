import { expect, test, type Page } from "@playwright/test";

type Role = "participant" | "organizer";

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
  }
};

async function useRole(page: Page, role: Role) {
  await page.addInitScript((profile: (typeof roleProfiles)[Role]) => {
    window.localStorage.setItem("seal.demo.session", JSON.stringify(profile));
  }, roleProfiles[role]);
}

async function expectStableScreenshot(page: Page) {
  const screenshot = await page.screenshot({
    fullPage: true,
    animations: "disabled"
  });
  expect(screenshot.byteLength).toBeGreaterThan(10_000);

  const metrics = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.scrollHeight,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }));
  expect(metrics.width).toBeGreaterThan(300);
  expect(metrics.height).toBeGreaterThan(400);
  expect(metrics.overflow).toBeLessThanOrEqual(2);
}

test("participant dashboard visual snapshot", async ({ page }) => {
  await useRole(page, "participant");
  await page.goto("/me");
  await expect(page.getByRole("heading", { name: "Quantum Nexus" })).toBeVisible();
  await expectStableScreenshot(page);
});

test("organizer dashboard visual snapshot", async ({ page }) => {
  await useRole(page, "organizer");
  await page.goto("/organizer/dashboard");
  await expect(page.getByRole("heading", { name: "SEAL Hackathon 2026" })).toBeVisible();
  await expectStableScreenshot(page);
});

test("organizer scoring visual snapshot", async ({ page }) => {
  await useRole(page, "organizer");
  await page.goto("/organizer/scoring");
  await expect(page.getByRole("heading", { name: "Theo doi phieu cham" })).toBeVisible();
  await expectStableScreenshot(page);
});

test("organizer ranking visual snapshot", async ({ page }) => {
  await useRole(page, "organizer");
  await page.goto("/organizer/ranking");
  await expect(page.getByRole("heading", { name: "Bang xep hang theo bang thi" })).toBeVisible();
  await expectStableScreenshot(page);
});

test("public results visual snapshot", async ({ page }) => {
  await page.goto("/events/1/results");
  await expect(page.getByRole("heading", { name: "Ket qua SEAL Hackathon 2026" })).toBeVisible();
  await expectStableScreenshot(page);
});
