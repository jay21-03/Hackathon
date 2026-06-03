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

test("participant dashboard visual snapshot", async ({ page }) => {
  await useRole(page, "participant");
  await page.goto("/me");
  await expect(page.getByRole("heading", { name: "Quantum Nexus" })).toBeVisible();
  await expect(page).toHaveScreenshot("participant-dashboard.png", {
    fullPage: true,
    animations: "disabled"
  });
});

test("organizer dashboard visual snapshot", async ({ page }) => {
  await useRole(page, "organizer");
  await page.goto("/organizer/dashboard");
  await expect(page.getByRole("heading", { name: "SEAL Hackathon 2026" })).toBeVisible();
  await expect(page).toHaveScreenshot("organizer-dashboard.png", {
    fullPage: true,
    animations: "disabled"
  });
});

test("organizer scoring visual snapshot", async ({ page }) => {
  await useRole(page, "organizer");
  await page.goto("/organizer/scoring");
  await expect(page.getByRole("heading", { name: "Theo doi score sheet" })).toBeVisible();
  await expect(page).toHaveScreenshot("organizer-scoring.png", {
    fullPage: true,
    animations: "disabled"
  });
});

test("organizer ranking visual snapshot", async ({ page }) => {
  await useRole(page, "organizer");
  await page.goto("/organizer/ranking");
  await expect(page.getByRole("heading", { name: "Bang xep hang theo bang thi" })).toBeVisible();
  await expect(page).toHaveScreenshot("organizer-ranking.png", {
    fullPage: true,
    animations: "disabled"
  });
});

test("public results visual snapshot", async ({ page }) => {
  await page.goto("/events/1/results");
  await expect(page.getByRole("heading", { name: "Ket qua SEAL Hackathon 2026" })).toBeVisible();
  await expect(page).toHaveScreenshot("public-results.png", {
    fullPage: true,
    animations: "disabled"
  });
});
