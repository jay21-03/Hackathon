import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";
import { demoBoards } from "../mocks/hackathonDemoData";

export async function fetchBoards(eventId: string) {
  return withApiFallback(() => apiClient.get(`/events/${eventId}/boards`).then((r) => r.data), demoBoards);
}

export async function assignJudge(boardId: string, judgeId: string) {
  try {
    const res = await apiClient.post(`/boards/${boardId}/assign-judge`, { judgeId });
    return { data: res.data, usingFallback: false };
  } catch {
    return { data: { boardId, judgeId }, usingFallback: true };
  }
}
