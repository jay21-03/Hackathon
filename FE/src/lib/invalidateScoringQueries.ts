import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

export async function invalidateAfterRubricMutation(
  queryClient: QueryClient,
  roundId: number | null
) {
  await queryClient.invalidateQueries({ queryKey: queryKeys.scoring.rubric(roundId) });
  await queryClient.invalidateQueries({ queryKey: queryKeys.scoring.all });
}

export async function invalidateAfterScoreMatrixMutation(
  queryClient: QueryClient,
  boardId: number | null
) {
  await queryClient.invalidateQueries({ queryKey: queryKeys.scoring.matrix(boardId) });
  await queryClient.invalidateQueries({ queryKey: queryKeys.scoring.progress(boardId) });
}
