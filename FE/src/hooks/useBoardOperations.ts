import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { queryKeys } from "../lib/queryKeys";
import {
  fetchBoardJudges,
  fetchBoardMentors,
  type AssignmentResponse
} from "../services/assignmentService";
import { fetchAdminUsers, type UserSummaryResponse } from "../services/userService";
import { resolveApiError } from "../utils/apiError";
import { useProblemManagement } from "./useProblemManagement";

/** State + loaders cho hub Vận hành bảng (đề + mentor/GK theo bảng đang chọn). */
export function useBoardOperations(eventId: number | null) {
  const queryClient = useQueryClient();
  const problemState = useProblemManagement(eventId);
  const { boardId } = problemState;

  const usersQuery = useQuery({
    queryKey: [...queryKeys.assignments.all, "board-ops-users"],
    queryFn: () => fetchAdminUsers({ page: 0, size: 500 }),
    enabled: Boolean(eventId)
  });

  const boardAssignmentsQuery = useQuery({
    queryKey: [...queryKeys.assignments.all, "board-ops", boardId],
    queryFn: async (): Promise<{ mentors: AssignmentResponse[]; judges: AssignmentResponse[] }> => {
      const [mentors, judges] = await Promise.all([
        fetchBoardMentors(boardId!),
        fetchBoardJudges(boardId!)
      ]);
      return { mentors, judges };
    },
    enabled: Boolean(boardId)
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

  const boardMentors = boardAssignmentsQuery.data?.mentors ?? [];
  const boardJudges = boardAssignmentsQuery.data?.judges ?? [];

  const invalidateAssignments = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
  }, [queryClient]);

  const invalidateAll = useCallback(async () => {
    await problemState.invalidate();
    await invalidateAssignments();
  }, [invalidateAssignments, problemState]);

  const loading =
    problemState.loading ||
    usersQuery.isLoading ||
    (Boolean(boardId) && boardAssignmentsQuery.isLoading);

  const assignmentError = usersQuery.error || boardAssignmentsQuery.error;
  const error =
    problemState.error ??
    (assignmentError
      ? resolveApiError(assignmentError, "Không tải được phân công.")
      : null);

  return {
    ...problemState,
    mentors,
    judges,
    boardMentors,
    boardJudges,
    loading,
    error,
    invalidate: invalidateAll,
    invalidateAssignments
  };
}
