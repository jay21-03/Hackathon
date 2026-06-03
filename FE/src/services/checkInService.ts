import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";
import { demoCheckIns } from "../mocks/hackathonDemoData";

export function fetchCheckIns(eventId?: string) {
  return withApiFallback(
    () =>
      eventId
        ? apiClient.get(`/events/${eventId}/check-ins`).then((response) => response.data)
        : apiClient.get<typeof demoCheckIns>("/check-ins").then((response) => response.data),
    demoCheckIns
  );
}

export async function createCheckIn(eventId: string, payload: unknown) {
  const { data } = await apiClient.post(`/events/${eventId}/check-ins`, payload);
  return data;
}

export async function updateCheckInStatus(id: number, status: string) {
  return apiClient.patch(`/check-ins/${id}`, { status });
}
