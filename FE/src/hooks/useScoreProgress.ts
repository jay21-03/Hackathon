import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchScoreProgress } from "../services/scoringApi";
import { getApiErrorMessage } from "../utils/apiError";
import { mapOrganizerErrorMessage } from "../utils/organizerErrors";

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
      ? mapOrganizerErrorMessage(getApiErrorMessage(query.error, "Không tải được tiến độ chấm."))
      : null,
    refetch: query.refetch
  };
}
