import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchJudgeAssignments } from "../services/assignmentService";
import { resolveApiError } from "../utils/apiError";

export function useJudgeAssignments() {
  const query = useQuery({
    queryKey: queryKeys.assignments.judge(),
    queryFn: fetchJudgeAssignments
  });

  return {
    assignments: query.data ?? [],
    loading: query.isLoading,
    error: query.isError
      ? resolveApiError(query.error, "Không tải được phân công.")
      : null,
    refetch: query.refetch
  };
}
