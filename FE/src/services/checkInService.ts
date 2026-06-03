import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";
import { demoTeams } from "../mocks/hackathonDemoData";

export async function fetchCheckIns(eventId: string) {
  return withApiFallback(() => apiClient.get(`/events/${eventId}/check-ins`).then((r) => r.data), demoTeams);
}

export async function createCheckIn(eventId: string, payload: any) {
  try {
    const res = await apiClient.post(`/events/${eventId}/check-ins`, payload);
    return { data: res.data, usingFallback: false };
  } catch {
    return { data: { success: true }, usingFallback: true };
  }
}
import { demoCheckIns } from "../mocks/hackathonDemoData";
import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";

export function fetchCheckIns() {
  return withApiFallback(async () => (await apiClient.get<typeof demoCheckIns>("/check-ins")).data, demoCheckIns);
}

export async function updateCheckInStatus(id: number, status: string) {
  return apiClient.patch(`/check-ins/${id}`, { status });
}
