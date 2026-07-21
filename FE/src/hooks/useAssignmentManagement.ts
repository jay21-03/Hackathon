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
import { type UserSummaryResponse } from "../services/userService";
import { resolveApiError } from "../utils/apiError";
import { useTermStaffPool } from "./useTermStaffPool";

type BoardAssignments = {
  mentors: AssignmentResponse[];
  judges: AssignmentResponse[];
};

type UseAssignmentManagementOptions = {
  academicTermId?: number | null;
};

export function useAssignmentManagement(
  eventId: number | null,
  options?: UseAssignmentManagementOptions
) {
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

  const byBoard = useMemo(() => assignmentsQuery.data ?? {}, [assignmentsQuery.data]);
  const allAssignedMentorIds = useMemo(
    () =>
      Object.values(byBoard).flatMap((entry) => entry.mentors.map((row) => row.assigneeId)),
    [byBoard]
  );
  const allAssignedJudgeIds = useMemo(
    () =>
      Object.values(byBoard).flatMap((entry) => entry.judges.map((row) => row.assigneeId)),
    [byBoard]
  );

  const staffPool = useTermStaffPool({
    academicTermId: options?.academicTermId,
    enabled: Boolean(eventId),
    assignedMentorIds: allAssignedMentorIds,
    assignedJudgeIds: allAssignedJudgeIds
  });

  const mentors = staffPool.mentors;
  const judges = staffPool.judges;

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    await queryClient.invalidateQueries({ queryKey: queryKeys.academicTerms.all });
  }

  const loading =
    roundsQuery.isLoading ||
    boardsQuery.isLoading ||
    staffPool.loading ||
    assignmentsQuery.isLoading;
  const error =
    roundsQuery.error || boardsQuery.error || staffPool.error || assignmentsQuery.error
      ? resolveApiError(
          roundsQuery.error ?? boardsQuery.error ?? staffPool.error ?? assignmentsQuery.error,
          "Không tải được phân công."
        )
      : null;

  return {
    rounds: (roundsQuery.data ?? []) as RoundResponse[],
    boards: boardsQuery.data ?? [],
    users: [...mentors, ...judges] as UserSummaryResponse[],
    byBoard,
    mentors,
    judges,
    staffPoolTermScoped: staffPool.termScoped,
    loading,
    error,
    invalidate
  };
}
