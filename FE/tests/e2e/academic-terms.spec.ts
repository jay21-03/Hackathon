import { expect, test } from "@playwright/test";

import { mockCoreApis } from "./helpers/mockApi";

import { mockAcademicTermApis, sampleAcademicTerms } from "./helpers/mockAcademicTermApis";

import { seedAuth } from "./helpers/auth";

import { waitForWorkspace } from "./helpers/waitForApp";



test.beforeEach(async ({ page }) => {

  await mockCoreApis(page);

  await mockAcademicTermApis(page);

});



test("academic term page shows scoped participants tab", async ({ page }) => {

  await seedAuth(page, "organizer");

  await page.goto("/organizer/academic-terms");

  await waitForWorkspace(page, /Học kỳ/i);

  await page.getByRole("button", { name: "Theo dõi kỳ" }).click();
  await page.getByRole("button", { name: "Nhân sự" }).click();

  await page.getByRole("button", { name: "Thí sinh" }).click();

  await expect.poll(async () => page.locator("body").innerText()).toContain("Nguyễn Văn A");

});



test("organizer can view academic term list", async ({ page }) => {

  await seedAuth(page, "organizer");

  await page.goto("/organizer/academic-terms");

  await waitForWorkspace(page, /Học kỳ/i);

  await expect(page.locator("body")).toContainText(sampleAcademicTerms[0].name);

  await expect(page.locator("body")).toContainText(sampleAcademicTerms[0].code);

});



test("organizer dashboard shows term and event selectors", async ({ page }) => {

  await seedAuth(page, "organizer");

  await page.goto("/organizer/dashboard");

  await waitForWorkspace(page, /Tổng quan|Cuộc thi/i);

  await expect(page.locator("body")).toContainText("Học kỳ");

  await expect(page.locator("body")).toContainText("Cuộc thi");

  await expect(page.locator("body")).toContainText("Tổng quan học kỳ");

});



test("organizer can edit academic term inline", async ({ page }) => {

  let updated = false;

  await page.route("**/api/v1/admin/academic-terms/1", async (route) => {

    if (route.request().method() === "PUT") {

      updated = true;

      await route.fulfill({

        contentType: "application/json",

        body: JSON.stringify({

          success: true,

          message: "ok",

          data: { ...sampleAcademicTerms[0], name: "Spring Semester 2026" }

        })

      });

      return;

    }

    await route.continue();

  });



  await seedAuth(page, "organizer");

  await page.goto("/organizer/academic-terms");

  await waitForWorkspace(page, /Học kỳ/i);

  await page.getByRole("button", { name: "Sửa" }).first().click();

  await page.locator('input[value="Spring 2026"]').fill("Spring Semester 2026");

  await page.getByRole("button", { name: "Lưu", exact: true }).click();

  await expect.poll(() => updated).toBe(true);

});



test("create event page requires academic term", async ({ page }) => {

  await seedAuth(page, "organizer");

  await page.goto("/organizer/events/new");

  await waitForWorkspace(page, /Tạo cuộc thi mới/i);

  await expect(page.locator("body")).toContainText("Học kỳ");

  await expect(page.locator("select").first()).toBeVisible();

});



test("event list filters when academic term changes", async ({ page }) => {

  let requestedTermId: string | null = null;

  await page.route("**/api/v1/events**", async (route) => {

    if (route.request().method() === "GET") {

      const url = new URL(route.request().url());

      requestedTermId = url.searchParams.get("academicTermId");

      const events =

        requestedTermId === String(sampleAcademicTerms[1].id)

          ? [{ id: 2, name: "Fall Hackathon", status: "DRAFT", startDate: "2026-10-10", endDate: "2026-10-12", registrationStartAt: "2026-09-01T08:00:00+07:00", registrationEndAt: "2026-10-01T23:59:00+07:00", academicTermId: 2 }]

          : [{ id: 1, name: "SEAL Hackathon 2026", status: "REGISTRATION_OPEN", startDate: "2026-06-01", endDate: "2026-06-02", registrationStartAt: "2026-05-01T08:00:00+07:00", registrationEndAt: "2026-12-31T23:59:00+07:00", academicTermId: 1 }];

      await route.fulfill({

        contentType: "application/json",

        body: JSON.stringify({ success: true, message: "ok", data: events })

      });

      return;

    }

    await route.continue();

  });



  await seedAuth(page, "organizer");

  await page.goto("/organizer/events");

  await waitForWorkspace(page, /Quản lý cấu hình/i);



  const termSelect = page.locator("select").first();

  await termSelect.selectOption(String(sampleAcademicTerms[1].id));

  await expect.poll(() => requestedTermId).toBe(String(sampleAcademicTerms[1].id));

  await expect(page.locator("body")).toContainText("Fall Hackathon");

});


