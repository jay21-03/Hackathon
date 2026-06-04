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
  users: {
    admin: () => ["users", "admin"] as const
  }
};
