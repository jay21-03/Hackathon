import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchEventTeamSummary } from "../services/registrationService";

export function useEventTeamSummary(eventId: number | null) {
  const query = useQuery({
    queryKey: queryKeys.teams.summary(eventId ?? 0),
    queryFn: () => fetchEventTeamSummary(eventId!),
    enabled: Boolean(eventId)
  });

  return {
    summary: query.data,
    loading: query.isLoading,
    refetch: query.refetch
  };
}
