import type { ApiResponse } from "../types/api";
import { demoRegistrations } from "../mocks/hackathonDemoData";
import { apiClient } from "./apiClient";
import { withApiFallback } from "./apiFallback";

export interface RegisterTeamPayload {
  name: string;
  members: Array<{
    email: string;
    fullName: string;
    studentId?: string;
    university?: string;
  }>;
}

export interface TeamDetailResponse {
  id: number;
  eventId: number;
  name: string;
  status: string;
  members: Array<{
    id: number;
    email: string;
    fullName: string;
    status: string;
    contactPerson?: boolean;
  }>;
  confirmedAt?: string | null;
  rejectedReason?: string | null;
}

export function fetchRegistrations() {
  return withApiFallback(
    async () => (await apiClient.get<typeof demoRegistrations>("/registrations")).data,
    demoRegistrations
  );
}

export async function updateRegistrationStatus(id: number, status: string) {
  return apiClient.patch(`/registrations/${id}`, { status });
}

export async function registerTeam(eventId: number, payload: RegisterTeamPayload) {
  return withApiFallback(async () => {
    const { data } = await apiClient.post<ApiResponse<TeamDetailResponse>>(
      `/v1/events/${eventId}/teams`,
      payload
    );
    return data.data;
  }, null);
}

export async function confirmInvitation(token: string) {
  return withApiFallback(async () => {
    const { data } = await apiClient.post<ApiResponse<TeamDetailResponse>>(
      "/v1/team-invitations/confirm",
      { token }
    );
    return data.data;
  }, null);
}

export async function declineInvitation(token: string) {
  return withApiFallback(async () => {
    const { data } = await apiClient.post<ApiResponse<TeamDetailResponse>>(
      "/v1/team-invitations/decline",
      { token }
    );
    return data.data;
  }, null);
}
