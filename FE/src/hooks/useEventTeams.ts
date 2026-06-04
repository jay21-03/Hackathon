import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchEventTeams } from "../services/registrationService";
import { getApiErrorMessage } from "../utils/apiError";

export function useEventTeams(eventId: number | null) {
  const query = useQuery({
    queryKey: queryKeys.teams.byEvent(eventId ?? 0),
    queryFn: () => fetchEventTeams(eventId!),
    enabled: Boolean(eventId)
  });

  return {
    teams: query.data ?? [],
    loading: query.isLoading,
    error: query.isError
      ? getApiErrorMessage(query.error, "Không tải được danh sách đội.")
      : null,
    refetch: query.refetch
  };
}
