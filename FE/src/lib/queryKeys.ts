export const queryKeys = {
  events: {
    all: ["events"] as const,
    list: () => [...queryKeys.events.all, "list"] as const,
    detail: (id: string | number) => [...queryKeys.events.all, "detail", String(id)] as const
  },
  teams: {
    all: ["teams"] as const,
    my: (eventId: number | null) => [...queryKeys.teams.all, "my", eventId] as const,
    byEvent: (eventId: number) => [...queryKeys.teams.all, "event", eventId] as const
  },
  rounds: {
    all: ["rounds"] as const,
    byEvent: (eventId: number | null) => [...queryKeys.rounds.all, "event", eventId] as const,
    publicByEvent: (eventId: number | null) =>
      [...queryKeys.rounds.all, "public", eventId] as const,
    countdown: (roundId: number) => [...queryKeys.rounds.all, "countdown", roundId] as const
  },
  myBoard: {
    all: ["myBoard"] as const,
    byEvent: (eventId: number | null) => [...queryKeys.myBoard.all, eventId] as const
  },
  myProblem: {
    all: ["myProblem"] as const,
    byEvent: (eventId: number | null) => [...queryKeys.myProblem.all, eventId] as const
  },
  submission: {
    all: ["submission"] as const,
    my: (eventId: number | null) => [...queryKeys.submission.all, "my", eventId] as const,
    byEvent: (eventId: number | null, boardId?: number | null) =>
      [...queryKeys.submission.all, "event", eventId, boardId ?? "all"] as const
  },
  boards: {
    all: ["boards"] as const,
    byEvent: (eventId: number | null) => [...queryKeys.boards.all, "event", eventId] as const,
    roundDetail: (eventId: number | null, roundId: number | null) =>
      [...queryKeys.boards.all, "round-detail", eventId, roundId] as const
  },
  scoring: {
    all: ["scoring"] as const,
    rubric: (roundId: number | null) => [...queryKeys.scoring.all, "rubric", roundId] as const,
    progress: (boardId: number | null) => [...queryKeys.scoring.all, "progress", boardId] as const,
    matrix: (boardId: number | null) => [...queryKeys.scoring.all, "matrix", boardId] as const
  },
  assignments: {
    all: ["assignments"] as const,
    judge: () => ["assignments", "judge"] as const
  },
  users: {
    admin: () => ["users", "admin"] as const
  },
  rankings: {
    all: ["rankings"] as const,
    board: (boardId: number | null) => [...queryKeys.rankings.all, "board", boardId] as const,
    event: (eventId: number | null) => [...queryKeys.rankings.all, "event", eventId] as const,
    public: (eventId: number | null) => [...queryKeys.rankings.all, "public", eventId] as const
  },
  notifications: {
    all: ["notifications"] as const,
    list: (page = 0, size = 50, type?: string) =>
      [...queryKeys.notifications.all, "list", page, size, type ?? "all"] as const,
    unreadCount: () => [...queryKeys.notifications.all, "unread-count"] as const
  },
  announcements: {
    all: ["announcements"] as const,
    byEvent: (eventId: number | null) => [...queryKeys.announcements.all, "event", eventId] as const
  },
  invitations: {
    all: ["invitations"] as const,
    staff: (
      eventId: number | null,
      boardId: number | null,
      role: string,
      status: string,
      email: string,
      page: number,
      size: number
    ) =>
      [
        ...queryKeys.invitations.all,
        "staff",
        eventId,
        boardId,
        role || "all",
        status || "all",
        email || "",
        page,
        size
      ] as const,
    team: (
      eventId: number | null,
      status: string,
      email: string,
      page: number,
      size: number
    ) =>
      [...queryKeys.invitations.all, "team", eventId, status || "all", email || "", page, size] as const
  }
};
