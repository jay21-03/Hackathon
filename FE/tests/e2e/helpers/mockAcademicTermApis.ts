import type { Page } from "@playwright/test";

export const sampleAcademicTerms = [
  {
    id: 1,
    code: "SPRING_2026",
    name: "Spring 2026",
    year: 2026,
    termType: "SPRING",
    startDate: "2026-01-01",
    endDate: "2026-05-31",
    status: "ACTIVE",
    eventCount: 1
  },
  {
    id: 2,
    code: "FALL_2026",
    name: "Fall 2026",
    year: 2026,
    termType: "FALL",
    startDate: "2026-09-01",
    endDate: "2026-12-31",
    status: "ACTIVE",
    eventCount: 0
  }
] as const;

function ok<T>(data: T) {
  return { success: true, message: "ok", data };
}

const sampleDashboard = {
  academicTerm: { id: 1, code: "SPRING_2026", name: "Spring 2026" },
  eventCount: 1,
  teamCount: 3,
  participantCount: 8,
  mentorCount: 2,
  judgeCount: 2,
  rankingCount: 0,
  repositoryCount: 1,
  scoreSheetCount: 0
};

const sampleParticipants = {
  academicTerm: { id: 1, code: "SPRING_2026", name: "Spring 2026" },
  items: [
    { id: 1, teamId: 10, eventId: 1, email: "captain@seal.edu.vn", fullName: "Nguyễn Văn A", status: "CONFIRMED" }
  ],
  totalElements: 1,
  page: 0,
  size: 20,
  totalPages: 1
};

const sampleMentors = {
  academicTerm: { id: 1, code: "SPRING_2026", name: "Spring 2026" },
  items: [{ id: 3, email: "mentor@seal.edu.vn", fullName: "Mentor E2E" }],
  totalElements: 1,
  page: 0,
  size: 20,
  totalPages: 1
};

export async function mockAcademicTermApis(page: Page) {
  let terms = [...sampleAcademicTerms];

  await page.route("**/api/v1/admin/academic-terms/*/participants**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(ok(sampleParticipants))
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/academic-terms/*/mentors**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(ok(sampleMentors))
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/academic-terms/*/judges**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(ok({ ...sampleMentors, items: [] }))
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/academic-terms/**/dashboard**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "ok", data: sampleDashboard })
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/academic-terms**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === "GET" && /\/academic-terms(\?|$)/.test(url)) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(ok(terms))
      });
      return;
    }

    if (method === "POST" && /\/academic-terms(\?|$)/.test(url)) {
      const body = route.request().postDataJSON() as (typeof sampleAcademicTerms)[number];
      const created = { ...body, id: terms.length + 1, eventCount: 0 };
      terms = [...terms, created];
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(ok(created))
      });
      return;
    }

    if (method === "PUT") {
      const match = url.match(/\/academic-terms\/(\d+)/);
      if (match) {
        const id = Number(match[1]);
        const body = route.request().postDataJSON() as Partial<(typeof sampleAcademicTerms)[number]>;
        terms = terms.map((t) => (t.id === id ? { ...t, ...body } : t));
        const updated = terms.find((t) => t.id === id);
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify(ok(updated))
        });
        return;
      }
    }

    await route.fallback();
  });
}
