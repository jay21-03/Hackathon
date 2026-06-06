import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchEventSubmissions } from "../services/submissionApi";
import { getApiErrorMessage } from "../utils/apiError";
import { mapOrganizerErrorMessage } from "../utils/organizerErrors";

export function useEventSubmissions(eventId: number | null, boardId?: number | null) {
  const query = useQuery({
    queryKey: queryKeys.submission.byEvent(eventId, boardId),
    queryFn: () => fetchEventSubmissions(eventId!, boardId ?? undefined),
    enabled: Boolean(eventId)
  });

  return {
    submissions: query.data ?? [],
    loading: query.isLoading,
    error: query.isError
      ? mapOrganizerErrorMessage(getApiErrorMessage(query.error, "Không tải được danh sách bài nộp."))
      : null,
    refetch: query.refetch
  };
}
