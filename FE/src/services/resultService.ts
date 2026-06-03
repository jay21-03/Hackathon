import { demoEvent, demoScoreSheets, getRankingRows } from "../mocks/hackathonDemoData";
import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";

export function fetchPublishedResults() {
  return withApiFallback(
    async () => (await apiClient.get<ReturnType<typeof getRankingRows>>(`/events/${demoEvent.id}/results`)).data,
    getRankingRows()
  );
}

export function fetchResultPreview() {
  return withApiFallback(
    async () =>
      (await apiClient.get<{ rankings: ReturnType<typeof getRankingRows>; submittedSheets: typeof demoScoreSheets }>(
        `/events/${demoEvent.id}/results/preview`
      )).data,
    {
      rankings: getRankingRows(),
      submittedSheets: demoScoreSheets.filter((sheet) => sheet.status === "SUBMITTED")
    }
  );
}

export async function publishResults() {
  return apiClient.post(`/events/${demoEvent.id}/results/publish`);
}
