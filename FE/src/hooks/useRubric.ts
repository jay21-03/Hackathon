import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchRubric } from "../services/scoringApi";
import { getApiErrorMessage } from "../utils/apiError";
import { mapOrganizerErrorMessage } from "../utils/organizerErrors";

export function useRubric(roundId: number | null) {
  const query = useQuery({
    queryKey: queryKeys.scoring.rubric(roundId),
    queryFn: () => fetchRubric(roundId!),
    enabled: Boolean(roundId)
  });

  return {
    rubric: query.data ?? null,
    loading: query.isLoading,
    error: query.isError
      ? mapOrganizerErrorMessage(getApiErrorMessage(query.error, "Không tải được tiêu chí chấm."))
      : null,
    refetch: query.refetch
  };
}
