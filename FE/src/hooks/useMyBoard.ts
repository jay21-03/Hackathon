import { useQuery } from "@tanstack/react-query";
import { fetchMyBoard } from "../services/contestApi";
import { queryKeys } from "../lib/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";

export function useMyBoard(eventId: number | null) {
  const query = useQuery({
    queryKey: queryKeys.myBoard.byEvent(eventId),
    queryFn: () => fetchMyBoard(eventId!),
    enabled: Boolean(eventId)
  });

  return {
    board: query.data ?? null,
    loading: query.isLoading,
    error: query.isError
      ? getApiErrorMessage(query.error, "Không tải được thông tin bảng thi.")
      : null,
    refetch: query.refetch
  };
}
