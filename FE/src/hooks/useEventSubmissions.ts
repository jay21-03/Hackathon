import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchEventSubmissions } from "../services/submissionApi";
import { resolveApiError } from "../utils/apiError";

export function useEventSubmissions(
  eventId: number | null,
  boardId?: number | null,
  roundId?: number | null,
  page = 0,
  size = 50,
  options?: { status?: string; q?: string }
) {
  const status = options?.status;
  const q = options?.q?.trim() || undefined;
  const query = useQuery({
    queryKey: [...queryKeys.submission.byEvent(eventId, boardId), roundId, page, size, status ?? "ALL", q ?? ""],
    queryFn: () => fetchEventSubmissions(eventId!, { boardId, roundId, page, size, status, q }),
    enabled: Boolean(eventId)
  });

  return {
    submissions: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    page: query.data?.page ?? page,
    loading: query.isLoading,
    error: query.isError
      ? resolveApiError(query.error, "Không tải được danh sách bài nộp.")
      : null,
    refetch: query.refetch
  };
}
