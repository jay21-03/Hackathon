import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchMyTeams, type TeamDetailResponse } from "../services/registrationService";
import { getApiErrorMessage } from "../utils/apiError";

export function useMyTeam(eventId: number | null) {
  const query = useQuery({
    queryKey: queryKeys.teams.my(eventId),
    queryFn: () => fetchMyTeams(eventId!),
    enabled: Boolean(eventId)
  });

  const teams: TeamDetailResponse[] = query.data ?? [];
  const team = teams[0] ?? null;

  return {
    team,
    teams,
    loading: query.isLoading,
    error: query.isError
      ? getApiErrorMessage(query.error, "Không tải được thông tin đội.")
      : null,
    refetch: query.refetch
  };
}
