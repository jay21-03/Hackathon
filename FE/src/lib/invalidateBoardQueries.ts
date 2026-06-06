import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

/** Sau BTC gán đội / đổi slot — làm mới cache thí sinh. */
export async function invalidateAfterBoardMutation(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.myBoard.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myProblem.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.submission.all })
  ]);
}
