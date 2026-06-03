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
