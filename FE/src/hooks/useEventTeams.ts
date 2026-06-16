import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchEventTeams } from "../services/registrationService";
import { resolveApiError } from "../utils/apiError";

export function useEventTeams(
  eventId: number | null,
  options?: { page?: number; size?: number; status?: string; q?: string }
) {
  const page = options?.page ?? 0;
  const size = options?.size ?? 100;
  const status = options?.status;
  const q = options?.q?.trim() || undefined;
  const query = useQuery({
    queryKey: [...queryKeys.teams.byEvent(eventId ?? 0), page, size, status ?? "ALL", q ?? ""],
    queryFn: () => fetchEventTeams(eventId!, { page, size, status, q }),
    enabled: Boolean(eventId)
  });

  return {
    teams: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    loading: query.isLoading,
    error: query.isError
      ? resolveApiError(query.error, "Không tải được danh sách đội.")
      : null,
    refetch: query.refetch
  };
}
