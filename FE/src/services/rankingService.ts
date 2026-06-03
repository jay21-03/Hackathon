import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";
import { getRankingRows } from "../mocks/hackathonDemoData";

export function fetchRankings(eventId?: string) {
  return withApiFallback(
    () =>
      eventId
        ? apiClient.get(`/events/${eventId}/results`).then((response) => response.data)
        : apiClient.get<ReturnType<typeof getRankingRows>>("/ranking").then((response) => response.data),
    getRankingRows()
  );
}

export async function saveFinalists(teamIds: number[]) {
  return apiClient.post("/finalists", { teamIds });
}
