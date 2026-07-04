import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

/** Sau đăng ký / lời mời / duyệt / loại đội — làm mới cache liên quan. */
export async function invalidateAfterTeamMutation(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myBoard.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myProblem.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.submission.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.boards.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.awards.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.scoring.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all }),
    queryClient.invalidateQueries({ queryKey: ["mentor"] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
  ]);
}
