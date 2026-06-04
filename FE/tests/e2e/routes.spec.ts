import { expect, test } from "@playwright/test";
import { mockCoreApis } from "./helpers/mockApi";
import { seedAuth, type E2ERole } from "./helpers/auth";

const publicRoutes = ["/events", "/login"];

const protectedRoutes: Array<{ role: E2ERole; path: string; expectText: RegExp }> = [
  { role: "participant", path: "/me", expectText: /Đội E2E|Tổng quan|Chưa có đội/i },
  { role: "participant", path: "/me/problem", expectText: /Đề thi|Chưa có đội/i },
  { role: "organizer", path: "/organizer/dashboard", expectText: /Tổng quan|SEAL Hackathon/i },
  { role: "organizer", path: "/organizer/events", expectText: /Quản lý cấu hình|Tạo cuộc thi/i },
  { role: "organizer", path: "/organizer/events/new", expectText: /Tạo cuộc thi mới/i },
  { role: "organizer", path: "/organizer/invitations", expectText: /Lời mời|Thành viên đội/i },
  { role: "mentor", path: "/mentor/dashboard", expectText: /Mentor|đội/i },
  { role: "judge", path: "/judge/dashboard", expectText: /Giám khảo|đội/i }
];

test.beforeEach(async ({ page }) => {
  await mockCoreApis(page);
});

for (const path of publicRoutes) {
  test(`public route renders ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("body")).toContainText(/SEAL|Đăng nhập|Cuộc thi/i);
  });
}

for (const route of protectedRoutes) {
  test(`${route.role} route renders ${route.path}`, async ({ page }) => {
    await seedAuth(page, route.role);
    await page.goto(route.path);
    await expect(page.locator("body")).toContainText(route.expectText);
  });
}

test("unauthenticated user is redirected to login from workspace", async ({ page }) => {
  await page.goto("/organizer/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("participant cannot access organizer dashboard", async ({ page }) => {
  await seedAuth(page, "participant");
  await page.goto("/organizer/dashboard");
  await expect(page).toHaveURL(/\/events$/);
});
