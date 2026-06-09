import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchScoreMatrix } from "../services/scoringApi";
import { resolveApiError } from "../utils/apiError";

export function useScoreMatrix(boardId: number | null) {
  const query = useQuery({
    queryKey: queryKeys.scoring.matrix(boardId),
    queryFn: () => fetchScoreMatrix(boardId!),
    enabled: Boolean(boardId)
  });

  return {
    matrix: query.data ?? null,
    loading: query.isLoading,
    error: query.isError
      ? resolveApiError(query.error, "Không tải được ma trận chấm điểm.")
      : null,
    refetch: query.refetch
  };
}
