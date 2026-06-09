import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchEventRounds, fetchRoundBoards, type BoardResponse } from "../services/contestApi";
import { resolveApiError } from "../utils/apiError";

export interface EventBoardsData {
  rounds: Awaited<ReturnType<typeof fetchEventRounds>>;
  boards: BoardResponse[];
}

export function useEventBoards(eventId: number | null) {
  const query = useQuery({
    queryKey: queryKeys.boards.byEvent(eventId),
    queryFn: async (): Promise<EventBoardsData> => {
      const rounds = await fetchEventRounds(eventId!);
      const boards: BoardResponse[] = [];
      for (const round of rounds) {
        boards.push(...(await fetchRoundBoards(round.id)));
      }
      return { rounds, boards };
    },
    enabled: Boolean(eventId)
  });

  return {
    rounds: query.data?.rounds ?? [],
    boards: query.data?.boards ?? [],
    loading: query.isLoading,
    error: query.isError
      ? resolveApiError(query.error, "Không tải được danh sách bảng.")
      : null,
    refetch: query.refetch
  };
}
