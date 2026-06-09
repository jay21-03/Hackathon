import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

/** Sau công bố kết quả — refresh xếp hạng, readiness và trang công khai. */
export async function invalidateAfterPublish(
  queryClient: QueryClient,
  eventId: number | null | undefined
) {
  if (!eventId) return;
  await queryClient.invalidateQueries({ queryKey: queryKeys.rankings.event(eventId) });
  await queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all });
  await queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(String(eventId)) });
}
