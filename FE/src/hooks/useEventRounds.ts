import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchEventRounds } from "../services/contestApi";
import { resolveApiError } from "../utils/apiError";

export function useEventRounds(eventId: number | null) {
  const query = useQuery({
    queryKey: queryKeys.rounds.byEvent(eventId),
    queryFn: () => fetchEventRounds(eventId!),
    enabled: Boolean(eventId)
  });

  return {
    rounds: query.data ?? [],
    loading: query.isLoading,
    error: query.isError
      ? resolveApiError(query.error, "Không tải được danh sách vòng.")
      : null,
    refetch: query.refetch
  };
}
