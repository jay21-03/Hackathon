import { useQuery } from "@tanstack/react-query";
import { enableRanking } from "../config/features";
import { queryKeys } from "../lib/queryKeys";
import { fetchPublicEventResults } from "../services/rankingApi";

export function usePublicEventResults(eventId: number | null) {
  const query = useQuery({
    queryKey: queryKeys.rankings.public(eventId),
    enabled: enableRanking && Boolean(eventId),
    queryFn: () => fetchPublicEventResults(eventId!),
    staleTime: 30_000
  });

  return {
    results: query.data,
    resultsPublished: Boolean(query.data?.published),
    loading: query.isLoading,
    error: query.error
  };
}
