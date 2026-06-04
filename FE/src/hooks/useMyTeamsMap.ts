import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { queryKeys } from "../lib/queryKeys";
import { fetchMyTeams, type TeamDetailResponse } from "../services/registrationService";

/** Map eventId → đội của user (phần tử đầu nếu có). */
export function useMyTeamsMap(eventIds: number[], enabled: boolean) {
  const queries = useQueries({
    queries: eventIds.map((eventId) => ({
      queryKey: queryKeys.teams.my(eventId),
      queryFn: () => fetchMyTeams(eventId),
      enabled: enabled && eventId > 0,
      staleTime: 30_000
    }))
  });

  const loading = enabled && queries.some((q) => q.isLoading);

  const teamsByEventId = useMemo(() => {
    const map = new Map<number, TeamDetailResponse>();
    eventIds.forEach((eventId, index) => {
      const team = queries[index]?.data?.[0];
      if (team) map.set(eventId, team);
    });
    return map;
  }, [eventIds, queries]);

  return { teamsByEventId, loading };
}
