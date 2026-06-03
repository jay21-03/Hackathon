import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";
import { demoScoreSheets } from "../mocks/hackathonDemoData";

export async function fetchScoreSheets(eventId: string) {
  return withApiFallback(() => apiClient.get(`/events/${eventId}/scores`).then((r) => r.data), demoScoreSheets);
}

export async function submitScore(eventId: string, sheet: any) {
  try {
    const res = await apiClient.post(`/events/${eventId}/scores`, sheet);
    return { data: res.data, usingFallback: false };
  } catch {
    return { data: sheet, usingFallback: true };
  }
}
import { baseRubric, demoScoreSheets } from "../mocks/hackathonDemoData";
import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";

export function fetchScoreSheets() {
  return withApiFallback(
    async () => (await apiClient.get<typeof demoScoreSheets>("/score-sheets")).data,
    demoScoreSheets
  );
}

export function fetchRubric() {
  return withApiFallback(async () => (await apiClient.get<typeof baseRubric>("/rubric")).data, baseRubric);
}

export async function submitScoreSheet(teamId: number, scores: Record<string, number>) {
  return apiClient.post(`/score-sheets`, { teamId, scores, status: "SUBMITTED" });
}
