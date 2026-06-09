import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { queryKeys } from "../lib/queryKeys";
import {
  fetchBoardProblems,
  fetchEventRounds,
  fetchRoundBoards,
  type BoardResponse,
  type ProblemResponse,
  type RoundResponse
} from "../services/contestApi";
import { resolveApiError } from "../utils/apiError";

export function useProblemManagement(eventId: number | null) {
  const queryClient = useQueryClient();
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [boardId, setBoardId] = useState<number | null>(null);

  const roundsQuery = useQuery({
    queryKey: queryKeys.rounds.byEvent(eventId),
    queryFn: () => fetchEventRounds(eventId!),
    enabled: Boolean(eventId)
  });

  const rounds = useMemo(
    () => (roundsQuery.data ?? []) as RoundResponse[],
    [roundsQuery.data]
  );

  useEffect(() => {
    if (rounds.length === 0) {
      setSelectedRoundId(null);
      return;
    }
    setSelectedRoundId((prev) =>
      prev && rounds.some((r) => r.id === prev) ? prev : rounds[0].id
    );
  }, [rounds]);

  const boardsQuery = useQuery({
    queryKey: [...queryKeys.boards.all, "problems", eventId, selectedRoundId],
    queryFn: () => fetchRoundBoards(selectedRoundId!),
    enabled: Boolean(selectedRoundId)
  });

  const boards = useMemo(() => boardsQuery.data ?? [], [boardsQuery.data]);

  useEffect(() => {
    setBoardId((prev) =>
      prev && boards.some((b: BoardResponse) => b.id === prev) ? prev : boards[0]?.id ?? null
    );
  }, [boards]);

  const problemQuery = useQuery({
    queryKey: [...queryKeys.boards.all, "problem", boardId],
    queryFn: async () => {
      const list = await fetchBoardProblems(boardId!);
      return list[0] ?? null;
    },
    enabled: Boolean(boardId)
  });

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.rounds.byEvent(eventId) }),
      queryClient.invalidateQueries({ queryKey: [...queryKeys.boards.all, "problems", eventId] }),
      queryClient.invalidateQueries({ queryKey: [...queryKeys.boards.all, "problem"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.myProblem.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.submission.all })
    ]);
  }, [eventId, queryClient]);

  const loading =
    Boolean(eventId) &&
    (roundsQuery.isLoading || boardsQuery.isLoading || (Boolean(boardId) && problemQuery.isLoading));

  const error =
    roundsQuery.error || boardsQuery.error || problemQuery.error
      ? resolveApiError(
          roundsQuery.error ?? boardsQuery.error ?? problemQuery.error,
          "Không tải được cấu hình đề thi."
        )
      : null;

  return {
    rounds,
    selectedRoundId,
    setSelectedRoundId,
    boards,
    boardId,
    setBoardId,
    problem: (problemQuery.data ?? null) as ProblemResponse | null,
    loading,
    error,
    invalidate,
    refetchProblem: problemQuery.refetch
  };
}
