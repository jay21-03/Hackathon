import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { queryKeys } from "../lib/queryKeys";
import {
  fetchBoardJudges,
  fetchBoardMentors,
  type AssignmentResponse
} from "../services/assignmentService";
import {
  fetchEventRounds,
  fetchRoundBoards,
  type BoardResponse,
  type RoundResponse
} from "../services/contestApi";
import { fetchAdminUsers, type UserSummaryResponse } from "../services/userService";
import { resolveApiError } from "../utils/apiError";

type BoardAssignments = {
  mentors: AssignmentResponse[];
  judges: AssignmentResponse[];
};

export function useAssignmentManagement(eventId: number | null) {
  const queryClient = useQueryClient();

  const roundsQuery = useQuery({
    queryKey: [...queryKeys.assignments.all, "rounds", eventId],
    queryFn: () => fetchEventRounds(eventId!),
    enabled: Boolean(eventId)
  });

  const boardsQuery = useQuery({
    queryKey: [...queryKeys.assignments.all, "boards", eventId, roundsQuery.data],
    queryFn: async () => {
      const rounds = roundsQuery.data ?? [];
      const allBoards: BoardResponse[] = [];
      for (const round of rounds) {
        allBoards.push(...(await fetchRoundBoards(round.id)));
      }
      return allBoards;
    },
    enabled: Boolean(eventId) && Boolean(roundsQuery.data)
  });

  const usersQuery = useQuery({
    queryKey: [...queryKeys.assignments.all, "users"],
    queryFn: () => fetchAdminUsers({ page: 0, size: 500 }),
    enabled: Boolean(eventId)
  });

  const boardIds = (boardsQuery.data ?? []).map((board) => board.id);

  const assignmentsQuery = useQuery({
    queryKey: [...queryKeys.assignments.all, "by-board", boardIds],
    queryFn: async () => {
      const entries = await Promise.all(
        (boardsQuery.data ?? []).map(async (board) => {
          const [mentors, judges] = await Promise.all([
            fetchBoardMentors(board.id),
            fetchBoardJudges(board.id)
          ]);
          return [board.id, { mentors, judges }] as const;
        })
      );
      return Object.fromEntries(entries) as Record<number, BoardAssignments>;
    },
    enabled: boardIds.length > 0
  });

  const userItems = usersQuery.data?.items ?? [];
  const mentors = useMemo(
    () => userItems.filter((user: UserSummaryResponse) => user.roles.includes("MENTOR")),
    [userItems]
  );
  const judges = useMemo(
    () => userItems.filter((user: UserSummaryResponse) => user.roles.includes("JUDGE")),
    [userItems]
  );

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
  }

  const loading =
    roundsQuery.isLoading || boardsQuery.isLoading || usersQuery.isLoading || assignmentsQuery.isLoading;
  const error =
    roundsQuery.error || boardsQuery.error || usersQuery.error || assignmentsQuery.error
      ? resolveApiError(
          roundsQuery.error ?? boardsQuery.error ?? usersQuery.error ?? assignmentsQuery.error,
          "Không tải được phân công."
        )
      : null;

  return {
    rounds: (roundsQuery.data ?? []) as RoundResponse[],
    boards: boardsQuery.data ?? [],
    users: usersQuery.data?.items ?? ([] as UserSummaryResponse[]),
    byBoard: assignmentsQuery.data ?? {},
    mentors,
    judges,
    loading,
    error,
    invalidate
  };
}
