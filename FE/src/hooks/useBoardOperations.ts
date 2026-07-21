import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { queryKeys } from "../lib/queryKeys";
import {
  fetchBoardJudges,
  fetchBoardMentors,
  type AssignmentResponse
} from "../services/assignmentService";
import { type UserSummaryResponse } from "../services/userService";
import { resolveAssigneeLabel } from "../utils/assigneeLabels";
import { resolveApiError } from "../utils/apiError";
import { useProblemManagement } from "./useProblemManagement";
import { useTermStaffPool } from "./useTermStaffPool";

type UseBoardOperationsOptions = {
  academicTermId?: number | null;
};

/** State + loaders cho hub Vận hành bảng (đề + mentor/GK theo bảng đang chọn). */
export function useBoardOperations(
  eventId: number | null,
  options?: UseBoardOperationsOptions
) {
  const queryClient = useQueryClient();
  const problemState = useProblemManagement(eventId);
  const { boardId } = problemState;

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

  const boardMentors = useMemo(() => boardAssignmentsQuery.data?.mentors ?? [], [boardAssignmentsQuery.data?.mentors]);
  const boardJudges = useMemo(() => boardAssignmentsQuery.data?.judges ?? [], [boardAssignmentsQuery.data?.judges]);

  const staffPool = useTermStaffPool({
    academicTermId: options?.academicTermId,
    enabled: Boolean(eventId),
    assignedMentorIds: boardMentors.map((row) => row.assigneeId),
    assignedJudgeIds: boardJudges.map((row) => row.assigneeId)
  });

  const mentors = staffPool.mentors;
  const judges = staffPool.judges;

  const userNameById = useMemo(() => {
    const names = new Map<number, string>();
    for (const user of [...mentors, ...judges] as UserSummaryResponse[]) {
      names.set(user.id, user.fullName);
    }
    for (const row of [...boardMentors, ...boardJudges]) {
      if (!names.has(row.assigneeId)) {
        names.set(row.assigneeId, resolveAssigneeLabel(row));
      }
    }
    return Object.fromEntries(names);
  }, [boardJudges, boardMentors, judges, mentors]);

  const invalidateAssignments = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    await queryClient.invalidateQueries({ queryKey: queryKeys.academicTerms.all });
  }, [queryClient]);

  const invalidateAll = useCallback(async () => {
    await problemState.invalidate();
    await invalidateAssignments();
  }, [invalidateAssignments, problemState]);

  const loading =
    problemState.loading ||
    staffPool.loading ||
    (Boolean(boardId) && boardAssignmentsQuery.isLoading);

  const assignmentError = staffPool.error || boardAssignmentsQuery.error;
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
    staffPoolTermScoped: staffPool.termScoped,
    userNameById,
    loading,
    error,
    invalidate: invalidateAll,
    invalidateAssignments
  };
}
