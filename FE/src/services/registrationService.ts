import { demoRegistrations } from "../mocks/hackathonDemoData";
import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";

export function fetchRegistrations() {
  return withApiFallback(
    async () => (await apiClient.get<typeof demoRegistrations>("/registrations")).data,
    demoRegistrations
  );
}

export async function updateRegistrationStatus(id: number, status: string) {
  return apiClient.patch(`/registrations/${id}`, { status });
}
