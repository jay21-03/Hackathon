import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";
import { baseRubric, demoScoreSheets } from "../mocks/hackathonDemoData";

export function fetchScoreSheets(eventId?: string) {
  return withApiFallback(
    () =>
      eventId
        ? apiClient.get(`/events/${eventId}/scores`).then((response) => response.data)
        : apiClient.get<typeof demoScoreSheets>("/score-sheets").then((response) => response.data),
    demoScoreSheets
  );
}

export function fetchRubric() {
  return withApiFallback(() => apiClient.get<typeof baseRubric>("/rubric").then((response) => response.data), baseRubric);
}

export async function submitScore(eventId: string, sheet: unknown) {
  const { data } = await apiClient.post(`/events/${eventId}/scores`, sheet);
  return data;
}

export async function submitScoreSheet(teamId: number, scores: Record<string, number>) {
  return apiClient.post(`/score-sheets`, { teamId, scores, status: "SUBMITTED" });
}
