import { getRankingRows } from "../mocks/hackathonDemoData";
import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";

export function fetchRanking() {
  return withApiFallback(
    async () => (await apiClient.get<ReturnType<typeof getRankingRows>>("/ranking")).data,
    getRankingRows()
  );
}

export async function saveFinalists(teamIds: number[]) {
  return apiClient.post("/finalists", { teamIds });
}
