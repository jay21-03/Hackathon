import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchEventRounds } from "../services/contestApi";
import { getApiErrorMessage } from "../utils/apiError";
import { mapOrganizerErrorMessage } from "../utils/organizerErrors";

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
      ? mapOrganizerErrorMessage(getApiErrorMessage(query.error, "Không tải được danh sách vòng."))
      : null,
    refetch: query.refetch
  };
}
