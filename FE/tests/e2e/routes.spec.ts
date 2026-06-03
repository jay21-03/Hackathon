import { expect, test } from "@playwright/test";

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

const publicRoutes = ["/events", "/login"];

const protectedRoutes: Array<{ role: Role; path: string }> = [
  { role: "participant", path: "/events/1" },
  { role: "participant", path: "/events/1/results" },
  { role: "organizer", path: "/events/1" },
  { role: "organizer", path: "/events/1/results" },
  { role: "mentor", path: "/events/1" },
  { role: "mentor", path: "/events/1/results" },
  { role: "judge", path: "/events/1" },
  { role: "judge", path: "/events/1/results" },
  { role: "participant", path: "/register" },
  { role: "participant", path: "/team-invitation" },
  { role: "participant", path: "/team-invitations/status" },
  { role: "participant", path: "/me" },
  { role: "participant", path: "/me/team" },
  { role: "participant", path: "/me/status" },
  { role: "participant", path: "/me/board" },
  { role: "participant", path: "/me/profile" },
  { role: "participant", path: "/me/check-in" },
  { role: "participant", path: "/me/problem" },
  { role: "participant", path: "/me/submission" },
  { role: "participant", path: "/me/ai-review" },
  { role: "participant", path: "/me/results" },
  { role: "organizer", path: "/organizer/dashboard" },
  { role: "organizer", path: "/organizer/events" },
  { role: "organizer", path: "/organizer/events/new" },
  { role: "organizer", path: "/organizer/events/basic-info" },
  { role: "organizer", path: "/organizer/registrations" },
  { role: "organizer", path: "/organizer/users" },
  { role: "organizer", path: "/organizer/problems" },
  { role: "organizer", path: "/organizer/rubric" },
  { role: "organizer", path: "/organizer/boards" },
  { role: "organizer", path: "/organizer/assignments" },
  { role: "organizer", path: "/organizer/invitations" },
  { role: "organizer", path: "/organizer/check-ins" },
  { role: "organizer", path: "/organizer/scoring" },
  { role: "organizer", path: "/organizer/ranking" },
  { role: "organizer", path: "/organizer/finals" },
  { role: "organizer", path: "/organizer/disqualifications" },
  { role: "organizer", path: "/organizer/ai-auditor" },
  { role: "organizer", path: "/organizer/ai-insights" },
  { role: "organizer", path: "/organizer/publish-results" },
  { role: "organizer", path: "/organizer/announcements" },
  { role: "organizer", path: "/organizer/notifications" },
  { role: "organizer", path: "/organizer/export-success" },
  { role: "mentor", path: "/mentor/dashboard" },
  { role: "mentor", path: "/mentor/ai-review" },
  { role: "judge", path: "/judge/dashboard" },
  { role: "judge", path: "/judge/scoring" }
];

for (const path of publicRoutes) {
  test(`public route renders ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("body")).toContainText(/SEAL|Danh|Dang|Cong|Ket|Team|Cuoc/i);
    await expect(page.locator("body")).not.toContainText(/backend|telemetry|pipeline|gateway|operator|mock/i);
  });
}

for (const route of protectedRoutes) {
  test(`${route.role} route renders ${route.path}`, async ({ page }) => {
    await page.addInitScript((profile) => {
      window.localStorage.setItem("seal.demo.session", JSON.stringify(profile));
      window.localStorage.setItem("seal.demo.authenticated", "true");
    }, roleProfiles[route.role]);
    await page.goto(route.path);
    await expect(page.locator("body")).toContainText(/SEAL|Thi sinh|Ban to chuc|Mentor|Giam khao|Danh|Dang|Bang/i);
    await expect(page.locator("body")).not.toContainText(/backend|telemetry|pipeline|gateway|operator|mock/i);
  });
}

test("role guard redirects wrong role to own dashboard", async ({ page }) => {
  await page.addInitScript((profile) => {
    window.localStorage.setItem("seal.demo.session", JSON.stringify(profile));
    window.localStorage.setItem("seal.demo.authenticated", "true");
  }, roleProfiles.participant);
  await page.goto("/organizer/dashboard");
  await expect(page).toHaveURL(/\/me$/);
});
