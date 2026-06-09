import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchScoreProgress } from "../services/scoringApi";
import { resolveApiError } from "../utils/apiError";

export function useScoreProgress(boardId: number | null) {
  const query = useQuery({
    queryKey: queryKeys.scoring.progress(boardId),
    queryFn: () => fetchScoreProgress(boardId!),
    enabled: Boolean(boardId)
  });

  return {
    progress: query.data ?? null,
    loading: query.isLoading,
    error: query.isError
      ? resolveApiError(query.error, "Không tải được tiến độ chấm.")
      : null,
    refetch: query.refetch
  };
}
