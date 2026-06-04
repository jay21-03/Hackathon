import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchPublicEvents } from "../services/eventsApi";
import { getApiErrorMessage } from "../utils/apiError";

export function usePublicEvents() {
  const query = useQuery({
    queryKey: queryKeys.events.list(),
    queryFn: fetchPublicEvents,
    staleTime: 60_000
  });

  return {
    events: query.data ?? [],
    loading: query.isLoading,
    error: query.isError
      ? getApiErrorMessage(query.error, "Không tải được danh sách cuộc thi.")
      : null
  };
}
