import { useQuery } from "@tanstack/react-query";
import { fetchPublicEventRounds, fetchRoundCountdown } from "../services/contestApi";
import { queryKeys } from "../lib/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";
import { pickActiveRound } from "../utils/pickActiveRound";

export function useEventRound(eventId: number | null) {
  const roundsQuery = useQuery({
    queryKey: queryKeys.rounds.publicByEvent(eventId),
    queryFn: () => fetchPublicEventRounds(eventId!),
    enabled: Boolean(eventId)
  });

  const rounds = roundsQuery.data ?? [];
  const round = pickActiveRound(rounds);
  const roundId = round?.id ?? null;

  const countdownQuery = useQuery({
    queryKey: queryKeys.rounds.countdown(roundId ?? 0),
    queryFn: () => fetchRoundCountdown(roundId!),
    enabled: Boolean(roundId),
    refetchInterval: 30_000
  });

  return {
    rounds,
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
