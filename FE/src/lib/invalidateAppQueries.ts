import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

/** Sau đăng ký / lời mời / duyệt đội — làm mới cache liên quan. */
export async function invalidateAfterTeamMutation(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myBoard.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myProblem.all })
  ]);
}
