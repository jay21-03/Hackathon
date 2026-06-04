import { useQuery } from "@tanstack/react-query";
import { fetchPublicEventRounds, fetchRoundCountdown, type RoundResponse } from "../services/contestApi";
import { queryKeys } from "../lib/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";

export function useEventRound(eventId: number | null) {
  const roundsQuery = useQuery({
    queryKey: queryKeys.rounds.publicByEvent(eventId),
    queryFn: async (): Promise<RoundResponse | null> => {
      const rounds = await fetchPublicEventRounds(eventId!);
      return rounds[0] ?? null;
    },
    enabled: Boolean(eventId)
  });

  const round = roundsQuery.data ?? null;
  const roundId = round?.id ?? null;

  const countdownQuery = useQuery({
    queryKey: queryKeys.rounds.countdown(roundId ?? 0),
    queryFn: () => fetchRoundCountdown(roundId!),
    enabled: Boolean(roundId),
    refetchInterval: 30_000
  });

  return {
    round,
    roundId,
    countdown: countdownQuery.data ?? null,
    loading: roundsQuery.isLoading,
    error: roundsQuery.isError
      ? getApiErrorMessage(roundsQuery.error, "Không tải được thông tin vòng thi.")
      : null,
    reload: roundsQuery.refetch
  };
}
