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

async function switchRole(page: Page, role: Role) {
  await page.evaluate((profile) => {
    window.localStorage.setItem("seal.demo.session", JSON.stringify(profile));
  }, roleProfiles[role]);
}

test("participant registers a valid team and blocks duplicate member email", async ({ page }) => {
  await page.goto("/register");
  await page.getByTestId("member-email-0").fill("alex@seal.edu.vn");
  await page.getByTestId("submit-registration").click();
  await expect(page.locator("body")).toContainText("da thuoc doi Quantum Nexus");

  await page.getByTestId("member-email-0").fill("new-captain@seal.edu.vn");
  await page.getByTestId("submit-registration").click();
  await expect(page.getByTestId("registration-result")).toContainText("Cho xac nhan");
});

test("participant validates repository link and submits project", async ({ page }) => {
  await useRole(page, "participant");
  await page.goto("/me/submission");
  await page.getByTestId("repo-url").fill("https://example.com/project");
  await page.getByTestId("save-submission").click();
  await expect(page.getByTestId("repo-error")).toContainText("Repository phai la link");

  await page.getByTestId("repo-url").fill("https://github.com/seal/codestorm");
  await page.getByTestId("save-submission").click();
  await expect(page.getByTestId("submission-status-message")).toContainText("Da luu ban nhap");

  await page.getByTestId("submit-submission").click();
  await page.getByTestId("confirm-action-submit").click();
  await expect(page.getByTestId("submission-status-message")).toContainText("Da nop");
});

test("judge validates rubric range before submitting score", async ({ page }) => {
  await useRole(page, "judge");
  await page.goto("/judge/scoring");
  await page.getByTestId("rubric-score-0").fill("11");
  await page.getByTestId("save-score").click();
  await expect(page.locator("body")).toContainText("diem phai nam trong khoang 0-10");

  await page.getByTestId("rubric-score-0").fill("9");
  await page.getByTestId("submit-score").click();
  await page.getByTestId("confirm-action-submit").click();
  await expect(page.locator("body")).toContainText("Da chot");
});

test("organizer reviews ranking and manually chooses finalists", async ({ page }) => {
  await useRole(page, "organizer");
  await page.goto("/organizer/ranking");
  await expect(page.locator("body")).toContainText("Danh gia AI khong tinh diem");
  await expect(page.getByTestId("rank-score-42")).toContainText("42.7");

  await page.getByTestId("finalist-87").click();
  await expect(page.locator("body")).toContainText("Da chon 2 doi vao chung ket");
});

test("organizer approves registration and check-in records", async ({ page }) => {
  await useRole(page, "organizer");
  await page.goto("/organizer/registrations");
  await expect(page.locator("body")).toContainText("Theo doi ho so dang ky");
  await page.getByTestId("approve-registration-1002").click();
  await expect(page.locator("body")).toContainText("Da cap nhat ho so");

  await page.goto("/organizer/check-ins");
  await expect(page.locator("body")).toContainText("Duyet anh check-in");
  await page.getByTestId("approve-checkin-2002").click();
  await expect(page.getByTestId("checkin-card-2002")).toContainText("Da xac nhan");
});

test("dangerous organizer actions require confirmation", async ({ page }) => {
  await useRole(page, "organizer");
  await page.goto("/organizer/disqualifications");
  await page.getByRole("button", { name: "Loai doi" }).first().click();
  await expect(page.getByRole("heading", { name: "Xac nhan loai doi" })).toBeVisible();
  await page.getByTestId("confirm-action-submit").click();
  await expect(page.locator("body")).toContainText("Bi loai");

  await page.goto("/organizer/publish-results");
  await page.getByTestId("publish-results-button").click();
  await expect(page.getByRole("heading", { name: "Cong bo ket qua?" })).toBeVisible();
});

test("participant submits check-in and only sees problem after release time", async ({ page }) => {
  await useRole(page, "participant");
  await page.goto("/me/check-in");
  await page.getByTestId("submit-checkin").click();
  await expect(page.locator("body")).toContainText("Da nop anh check-in");

  await page.goto("/me/problem");
  await expect(page.locator("body")).toContainText("De thi chua duoc mo");
  await page.getByTestId("toggle-release-time").click();
  await expect(page.locator("body")).toContainText("Noi dung de thi");
  await expect(page.locator("body")).toContainText("Xep hang chi tinh phieu cham da chot");
});

test("organizer configures problem and reviews scoring progress", async ({ page }) => {
  await useRole(page, "organizer");
  await page.goto("/organizer/problems");
  await page.getByTestId("publish-problem").click();
  await expect(page.getByRole("heading", { name: "Cong bo de thi?" })).toBeVisible();
  await page.getByTestId("confirm-action-submit").click();
  await expect(page.locator("body")).toContainText("Da cong bo");

  await page.goto("/organizer/scoring");
  await expect(page.locator("body")).toContainText("Xep hang chi tinh phieu cham da chot");
  await expect(page.locator("body")).toContainText("Ban nhap");
});

test("public and participant can view published results", async ({ page }) => {
  await page.goto("/events/1/results");
  await expect(page.locator("body")).toContainText("Da cong bo");
  await expect(page.locator("body")).toContainText("Quantum Nexus");

  await useRole(page, "participant");
  await page.goto("/me/results");
  await expect(page.locator("body")).toContainText("Ket qua SEAL Hackathon 2026");
});

test("full hackathon flow from registration to published results", async ({ page }) => {
  await page.goto("/register");
  await page.getByTestId("team-name").fill("Flow Masters");
  await page.getByTestId("member-email-0").fill("flow-captain@seal.edu.vn");
  await page.getByTestId("submit-registration").click();
  await expect(page.getByTestId("registration-result")).toContainText("Cho xac nhan");

  await switchRole(page, "organizer");
  await page.goto("/organizer/registrations");
  await page.getByTestId("approve-registration-1002").click();
  await expect(page.locator("body")).toContainText("Da cap nhat ho so");

  await page.goto("/organizer/check-ins");
  await page.getByTestId("approve-checkin-2002").click();
  await expect(page.getByTestId("checkin-card-2002")).toContainText("Da xac nhan");

  await switchRole(page, "participant");
  await page.goto("/me/problem");
  await expect(page.locator("body")).toContainText("De thi chua duoc mo");
  await page.getByTestId("toggle-release-time").click();
  await expect(page.locator("body")).toContainText("Noi dung de thi");

  await page.goto("/me/submission");
  await page.getByTestId("repo-url").fill("https://github.com/seal/flow-masters");
  await page.getByTestId("submit-submission").click();
  await page.getByTestId("confirm-action-submit").click();
  await expect(page.getByTestId("submission-status-message")).toContainText("Da nop");

  await page.goto("/me/ai-review");
  await expect(page.locator("body")).toContainText("Khong tinh xep hang");

  await switchRole(page, "judge");
  await page.goto("/judge/scoring");
  await page.getByTestId("rubric-score-0").fill("9");
  await page.getByTestId("submit-score").click();
  await page.getByTestId("confirm-action-submit").click();
  await expect(page.locator("body")).toContainText("Da chot");

  await switchRole(page, "organizer");
  await page.goto("/organizer/ranking");
  await page.getByTestId("finalist-87").click();
  await expect(page.locator("body")).toContainText("Da chon 2 doi vao chung ket");

  await page.goto("/organizer/publish-results");
  await page.getByTestId("publish-results-button").click();
  await page.getByTestId("confirm-action-submit").click();
  await expect(page.locator("body")).toContainText("Da cong bo");

  await page.goto("/events/1/results");
  await expect(page.locator("body")).toContainText("Ket qua SEAL Hackathon 2026");
});
