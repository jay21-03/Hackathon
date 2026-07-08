import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchScoreMatrix } from "../services/scoringApi";
import { resolveApiError } from "../utils/apiError";

export function useScoreMatrix(
  boardId: number | null,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) {
  const enabled = Boolean(boardId) && (options?.enabled ?? true);
  const query = useQuery({
    queryKey: queryKeys.scoring.matrix(boardId),
    queryFn: () => fetchScoreMatrix(boardId!),
    enabled,
    refetchInterval: enabled ? (options?.refetchInterval ?? false) : false
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
