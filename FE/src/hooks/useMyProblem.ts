import { useQuery } from "@tanstack/react-query";
import { fetchMyProblem } from "../services/contestApi";
import { queryKeys } from "../lib/queryKeys";
import { resolveApiError } from "../utils/apiError";

export function useMyProblem(eventId: number | null) {
  const query = useQuery({
    queryKey: queryKeys.myProblem.byEvent(eventId),
    queryFn: () => fetchMyProblem(eventId!),
    enabled: Boolean(eventId)
  });

  return {
    problemState: query.data ?? null,
    loading: query.isLoading,
    error: query.isError
      ? resolveApiError(query.error, "Không tải được đề thi.")
      : null,
    refetch: query.refetch
  };
}
