import type { Page } from "@playwright/test";

const sampleEvent = {
  id: 1,
  name: "SEAL Hackathon 2026",
  startDate: "2026-06-01",
  endDate: "2026-06-02",
  registrationStartAt: "2026-05-01T08:00:00+07:00",
  registrationEndAt: "2026-12-31T23:59:00+07:00",
  minTeamSize: 1,
  maxTeamSize: 5,
  status: "REGISTRATION_OPEN"
};

const sampleRound = {
  id: 1,
  eventId: 1,
  name: "Vòng 1",
  roundType: "MAIN",
  roundOrder: 1,
  startAt: "2026-06-01T08:00:00+07:00",
  endAt: "2026-06-01T18:00:00+07:00",
  status: "ACTIVE"
};

export const sampleTeam = {
  id: 10,
  eventId: 1,
  name: "Đội E2E Alpha",
  status: "CONFIRMED",
  members: [
    {
      id: 101,
      email: "captain@seal.edu.vn",
      fullName: "Nguyễn Văn A",
      status: "CONFIRMED",
      contactPerson: true
    }
  ]
};

const eventDetail = {
  ...sampleEvent,
  minTeamSize: 1,
  maxTeamSize: 5,
  maxTeams: 50,
  description: "E2E event"
};

function ok<T>(data: T) {
  return { success: true, message: "ok", data };
}

function json(route: import("@playwright/test").Route, data: unknown) {
  return route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(data)
  });
}

/**
 * Mock API cho E2E — không cần backend.
 * Route đăng ký sau được ưu tiên trước (Playwright reverse order).
 */
export async function mockCoreApis(page: Page) {
  // Fallback thấp nhất — tránh 401 redirect về /login
  await page.route("**/api/**", async (route) => {
    if (route.request().method() === "GET") {
      await json(route, ok([]));
      return;
    }
    await json(route, ok(null));
  });

  await page.route("**/api/v1/me**", async (route) => {
    await json(
      route,
      ok({
        id: 1,
        email: "organizer@seal.edu.vn",
        fullName: "Ban tổ chức E2E",
        status: "ACTIVE",
        roles: ["ORGANIZER", "PARTICIPANT", "MENTOR", "JUDGE"]
      })
    );
  });

  await page.route("**/api/v1/my/board**", async (route) => {
    await json(
      route,
      ok({
        assigned: true,
        boardId: 1,
        boardName: "Bảng A",
        slotNumber: 3,
        roundId: 1
      })
    );
  });

  await page.route("**/api/v1/my/problem**", async (route) => {
    await json(route, ok({ available: false, reason: "NOT_RELEASED" }));
  });

  await page.route("**/api/v1/my/teams**", async (route) => {
    await json(route, ok([sampleTeam]));
  });

  await page.route("**/api/v1/rounds/*/countdown**", async (route) => {
    await json(route, ok({ status: "RUNNING", remainingSeconds: 3600 }));
  });

  await page.route("**/api/v1/events/*/rounds**", async (route) => {
    if (route.request().method() === "GET") {
      await json(route, ok([sampleRound]));
    } else {
      await route.continue();
    }
  });

  await page.route("**/api/v1/events/*/teams**", async (route) => {
    if (route.request().method() === "GET") {
      await json(route, ok({
        items: [sampleTeam],
        page: 0,
        size: 100,
        total: 1,
        totalPages: 1
      }));
    } else {
      await route.continue();
    }
  });

  await page.route("**/api/v1/events/*", async (route) => {
    const url = route.request().url();
    if (route.request().method() === "GET" && /\/events\/\d+(\?|$)/.test(url)) {
      await json(route, ok(eventDetail));
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/events**", async (route) => {
    if (route.request().method() === "GET") {
      await json(route, ok([sampleEvent]));
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/events/*/rounds**", async (route) => {
    if (route.request().method() === "GET") {
      await json(route, ok([sampleRound]));
    } else {
      await route.continue();
    }
  });

  await page.route("**/api/v1/admin/events/*", async (route) => {
    const url = route.request().url();
    if (route.request().method() === "GET" && /\/admin\/events\/\d+(\?|$)/.test(url)) {
      await json(route, ok(eventDetail));
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/users**", async (route) => {
    await json(
      route,
      ok({
        items: [
          {
            id: 1,
            email: "organizer@seal.edu.vn",
            fullName: "Organizer",
            status: "ACTIVE",
            roles: ["ORGANIZER"],
            createdAt: "2026-01-01T00:00:00+07:00"
          }
        ],
        page: 0,
        size: 100,
        total: 1,
        totalPages: 1
      })
    );
  });

  const sampleBoard = {
    id: 1,
    roundId: 1,
    name: "Bảng A",
    boardOrder: 1,
    status: "ACTIVE"
  };

  const levelDescriptors = [
    { level: "EXCELLENT", label: "Xuất sắc", minScore: 9, maxScore: 10, description: "E2E" },
    { level: "GOOD", label: "Tốt", minScore: 7, maxScore: 8.9, description: "E2E" },
    { level: "SATISFACTORY", label: "Đạt", minScore: 5, maxScore: 6.9, description: "E2E" },
    { level: "UNSATISFACTORY", label: "Chưa đạt", minScore: 0, maxScore: 4.9, description: "E2E" }
  ];

  const sampleRubric = {
    roundId: 1,
    criteria: [
      {
        id: 1,
        code: "R1_01",
        name: "Ý tưởng",
        weight: 100,
        minScore: 0,
        maxScore: 10,
        sortOrder: 1,
        levelDescriptors
      }
    ],
    totalWeight: 100,
    locked: false
  };

  const sampleScoreProgress = {
    boardId: 1,
    boardName: "Bảng A",
    roundId: 1,
    summary: {
      teamCount: 1,
      judgeCount: 1,
      expectedSheets: 1,
      submittedSheets: 0,
      draftSheets: 1,
      missingSheets: 0,
      completionPercent: 0
    },
    judges: [{ judgeId: 1, fullName: "Giám khảo E2E", submittedCount: 0, totalTeams: 1 }],
    teams: [
      {
        teamId: 10,
        teamName: "Đội E2E Alpha",
        submittedJudgeCount: 0,
        requiredJudgeCount: 1,
        judges: [{ judgeId: 1, status: "DRAFT", sheetId: 1, judgeTeamScore: null }]
      }
    ]
  };

  await page.route("**/api/v1/admin/rounds/**", async (route) => {
    await json(route, ok([]));
  });

  await page.route("**/api/v1/admin/boards/**", async (route) => {
    await json(route, ok([]));
  });

  // Scoring — đăng ký sau catch-all để ưu tiên cao hơn (Playwright LIFO)
  await page.route("**/api/v1/admin/rounds/*/criteria**", async (route) => {
    if (route.request().method() === "GET" || route.request().method() === "POST") {
      await json(route, ok(sampleRubric));
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/rounds/*/boards**", async (route) => {
    if (route.request().method() === "GET") {
      await json(route, ok([sampleBoard]));
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/boards/*/score-progress**", async (route) => {
    await json(route, ok(sampleScoreProgress));
  });

  const sampleSubmission = {
    teamId: 10,
    teamName: "Đội E2E Alpha",
    status: "DRAFT",
    repositoryUrl: "https://github.com/seal/e2e-demo",
    repositoryName: "E2E Demo",
    submittedAt: null,
    deadlineAt: "2026-12-31T23:59:00+07:00",
    canSubmit: true,
    editable: true,
    blockReason: null
  };

  await page.route("**/api/v1/judges/assignments**", async (route) => {
    await json(
      route,
      ok([
        {
          id: 1,
          boardId: 1,
          assigneeId: 1,
          createdAt: "2026-06-01T08:00:00+07:00",
          createdBy: 1
        }
      ])
    );
  });

  const sampleScoreMatrix = {
    board: { id: 1, name: "Bảng A", roundId: 1, roundName: "Vòng 1" },
    judge: { id: 1, fullName: "Giám khảo E2E" },
    criteria: sampleRubric.criteria,
    teams: [
      {
        teamId: 10,
        teamName: "Đội E2E Alpha",
        slotNumber: 1,
        sheetId: 1,
        status: "DRAFT",
        generalFeedback: "",
        editable: true,
        scores: [{ criteriaId: 1, criteriaCode: "R1_01", scoreValue: null, comment: null }],
        computed: null
      }
    ],
    summary: { teamCount: 1, draftCount: 1, submittedCount: 0, criteriaCount: 1 }
  };

  await page.route("**/api/v1/judge/boards/*/score-matrix**", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await json(route, ok(sampleScoreMatrix));
      return;
    }
    if (method === "PUT") {
      await json(route, ok({ savedTeamIds: [10], skippedSubmittedTeamIds: [], rows: sampleScoreMatrix.teams }));
      return;
    }
    if (method === "POST") {
      await json(route, ok({
        submitted: [{ sheetId: 1, teamId: 10, status: "SUBMITTED" }],
        failed: []
      }));
      return;
    }
    await route.continue();
  });

  const sampleRankingEntry = {
    rank: 1,
    teamId: 10,
    teamName: "Đội E2E Alpha",
    slotNumber: 1,
    averageScore: 80,
    submittedJudgeCount: 1
  };

  const sampleBoardRanking = {
    boardId: 1,
    boardName: "Bảng A",
    roundId: 1,
    roundName: "Vòng 1",
    eventId: 1,
    published: false,
    calculatedAt: "2026-06-04T10:00:00+07:00",
    publishedAt: null,
    teamCount: 1,
    entries: [sampleRankingEntry]
  };

  const sampleEventRankings = {
    eventId: 1,
    eventName: "SEAL Hackathon 2026",
    anyPublished: false,
    boards: [sampleBoardRanking]
  };

  const samplePublicResults = {
    eventId: 1,
    eventName: "SEAL Hackathon 2026",
    published: false,
    publishedAt: null,
    boards: []
  };

  await page.route("**/api/v1/admin/boards/*/rankings/calculate**", async (route) => {
    await json(route, ok({ ...sampleBoardRanking, published: false }));
  });

  await page.route("**/api/v1/admin/boards/*/rankings/publish**", async (route) => {
    await json(route, ok({ ...sampleBoardRanking, published: true, publishedAt: "2026-06-04T12:00:00+07:00" }));
  });

  await page.route("**/api/v1/admin/boards/*/rankings**", async (route) => {
    if (route.request().method() === "GET") {
      await json(route, ok(sampleBoardRanking));
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/admin/events/*/rankings/publish**", async (route) => {
    await json(route, ok({ boardsCalculated: 1, teamsRanked: 1, message: "PUBLISHED" }));
  });

  await page.route("**/api/v1/admin/events/*/rankings**", async (route) => {
    if (route.request().method() === "GET") {
      await json(route, ok(sampleEventRankings));
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/events/*/results**", async (route) => {
    await json(route, ok(samplePublicResults));
  });

  await page.route("**/api/v1/my/submission**", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await json(route, ok(sampleSubmission));
      return;
    }
    if (method === "PUT") {
      await json(route, ok({ ...sampleSubmission, status: "DRAFT" }));
      return;
    }
    if (method === "POST") {
      await json(route, ok({
        ...sampleSubmission,
        status: "SUBMITTED",
        submittedAt: "2026-06-04T10:00:00+07:00"
      }));
      return;
    }
    await route.continue();
  });

  await mockNotificationApis(page);
}

type MockNotification = {
  id: number;
  eventId: number;
  eventName: string;
  type: string;
  title: string;
  content: string;
  linkUrl: string;
  read: boolean;
  createdAt: string;
};

/** Reset mock notification state between tests. */
export function resetMockNotificationState() {
  mockNotificationsState.nextId = 3;
  mockNotificationsState.items = [
    {
      id: 1,
      eventId: 1,
      eventName: "SEAL Hackathon 2026",
      type: "ANNOUNCEMENT",
      title: "Thông báo E2E",
      content: "Nội dung thông báo kiểm thử.",
      linkUrl: "/me/notifications?eventId=1",
      read: false,
      createdAt: "2026-06-04T08:00:00+07:00"
    },
    {
      id: 2,
      eventId: 1,
      eventName: "SEAL Hackathon 2026",
      type: "RANKING_PUBLISHED",
      title: "Kết quả đã công bố",
      content: "Xem trang kết quả.",
      linkUrl: "/me/results?eventId=1",
      read: true,
      createdAt: "2026-06-03T18:00:00+07:00"
    }
  ];
  mockNotificationsState.announcements = [
    {
      id: 10,
      eventId: 1,
      eventName: "SEAL Hackathon 2026",
      title: "Mở đăng ký",
      content: "Đăng ký đã mở.",
      publishedAt: "2026-05-01T08:00:00+07:00",
      createdAt: "2026-05-01T08:00:00+07:00",
      recipientCount: 0
    }
  ];
}

const mockNotificationsState = {
  nextId: 3,
  items: [
    {
      id: 1,
      eventId: 1,
      eventName: "SEAL Hackathon 2026",
      type: "ANNOUNCEMENT",
      title: "Thông báo E2E",
      content: "Nội dung thông báo kiểm thử.",
      linkUrl: "/me/notifications?eventId=1",
      read: false,
      createdAt: "2026-06-04T08:00:00+07:00"
    },
    {
      id: 2,
      eventId: 1,
      eventName: "SEAL Hackathon 2026",
      type: "RANKING_PUBLISHED",
      title: "Kết quả đã công bố",
      content: "Xem trang kết quả.",
      linkUrl: "/me/results?eventId=1",
      read: true,
      createdAt: "2026-06-03T18:00:00+07:00"
    }
  ] as MockNotification[],
  announcements: [
    {
      id: 10,
      eventId: 1,
      eventName: "SEAL Hackathon 2026",
      title: "Mở đăng ký",
      content: "Đăng ký đã mở.",
      publishedAt: "2026-05-01T08:00:00+07:00",
      createdAt: "2026-05-01T08:00:00+07:00",
      recipientCount: 0
    }
  ]
};

function unreadNotificationCount() {
  return mockNotificationsState.items.filter((item) => !item.read).length;
}

/** Mock notifications + announcements — đăng ký sau catch-all GET. */
export async function mockNotificationApis(page: Page) {
  await page.route(/\/api\/v1\/me\/notifications/, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes("/unread-count") && method === "GET") {
      await json(route, ok(unreadNotificationCount()));
      return;
    }

    if (url.includes("/read-all") && method === "PUT") {
      mockNotificationsState.items = mockNotificationsState.items.map((item) => ({ ...item, read: true }));
      await json(route, ok({
        items: mockNotificationsState.items,
        unreadCount: 0,
        total: mockNotificationsState.items.length,
        page: 0,
        size: 50
      }));
      return;
    }

    const readMatch = url.match(/\/notifications\/(\d+)\/read/);
    if (readMatch && method === "PUT") {
      const id = Number(readMatch[1]);
      const item = mockNotificationsState.items.find((row) => row.id === id);
      if (item) item.read = true;
      await json(route, ok(item ?? mockNotificationsState.items[0]));
      return;
    }

    if (method === "GET") {
      await json(route, ok({
        items: mockNotificationsState.items,
        unreadCount: unreadNotificationCount(),
        total: mockNotificationsState.items.length,
        page: 0,
        size: 50
      }));
      return;
    }

    await route.continue();
  });

  await page.route("**/api/v1/admin/events/*/announcements**", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await json(route, ok(mockNotificationsState.announcements));
      return;
    }
    if (method === "POST") {
      const body = route.request().postDataJSON() as { title?: string; content?: string };
      const created = {
        id: mockNotificationsState.nextId++,
        eventId: 1,
        eventName: sampleEvent.name,
        title: body.title ?? "Thông báo mới",
        content: body.content ?? "",
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        recipientCount: 2
      };
      mockNotificationsState.announcements.unshift(created);
      mockNotificationsState.items.unshift({
        id: mockNotificationsState.nextId++,
        eventId: 1,
        eventName: sampleEvent.name,
        type: "ANNOUNCEMENT",
        title: created.title,
        content: created.content,
        linkUrl: "/me/notifications?eventId=1",
        read: false,
        createdAt: created.publishedAt
      });
      await json(route, ok(created));
      return;
    }
    await route.continue();
  });
}
