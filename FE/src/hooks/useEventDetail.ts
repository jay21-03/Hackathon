import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchEventDetail } from "../services/eventsApi";
import { resolveApiError } from "../utils/apiError";

export function useEventDetail(eventId: string | number | null | undefined) {
  const id =
    eventId != null && eventId !== "" && !Number.isNaN(Number(eventId)) ? String(eventId) : null;

  const query = useQuery({
    queryKey: queryKeys.events.detail(id ?? "none"),
    queryFn: () => fetchEventDetail(id!),
    enabled: Boolean(id)
  });

  return {
    event: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? resolveApiError(query.error, "Không tải được thông tin cuộc thi.") : null,
    refetch: query.refetch
  };
}
