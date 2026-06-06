import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchMySubmission } from "../services/submissionApi";
import { getApiErrorMessage } from "../utils/apiError";
import { mapOrganizerErrorMessage } from "../utils/organizerErrors";

export function useMySubmission(eventId: number | null) {
  const query = useQuery({
    queryKey: queryKeys.submission.my(eventId),
    queryFn: () => fetchMySubmission(eventId!),
    enabled: Boolean(eventId)
  });

  return {
    submission: query.data ?? null,
    loading: query.isLoading,
    error: query.isError
      ? mapOrganizerErrorMessage(getApiErrorMessage(query.error, "Không tải được bài nộp."))
      : null,
    refetch: query.refetch
  };
}
