import { demoCheckIns } from "../mocks/hackathonDemoData";
import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";

export function fetchCheckIns() {
  return withApiFallback(async () => (await apiClient.get<typeof demoCheckIns>("/check-ins")).data, demoCheckIns);
}

export async function updateCheckInStatus(id: number, status: string) {
  return apiClient.patch(`/check-ins/${id}`, { status });
}
