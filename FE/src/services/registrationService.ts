import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";

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

export async function fetchEventTeams(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<TeamDetailResponse[]>>(`/v1/events/${eventId}/teams`);
  return data.data ?? [];
}

export async function updateTeamStatus(teamId: number, status: string, reason?: string) {
  const { data } = await apiClient.patch<ApiResponse<TeamDetailResponse>>(`/v1/teams/${teamId}/status`, {
    status,
    reason
  });
  return data.data;
}

export async function resendTeamInvitation(teamMemberId: number) {
  const { data } = await apiClient.post<ApiResponse<TeamDetailResponse>>("/v1/team-invitations/resend", {
    teamMemberId
  });
  if (!data.data) {
    throw new Error(data.message || "Gui lai loi moi that bai");
  }
  return data.data;
}

export async function registerTeam(eventId: number, payload: RegisterTeamPayload) {
  const { data } = await apiClient.post<ApiResponse<TeamDetailResponse>>(
    `/v1/events/${eventId}/teams`,
    payload
  );
  if (!data.data) {
    throw new Error(data.message || "Dang ky doi that bai");
  }
  return data.data;
}

export async function confirmInvitation(token: string) {
  const { data } = await apiClient.post<ApiResponse<TeamDetailResponse>>(
    "/v1/team-invitations/confirm",
    { token }
  );
  if (!data.data) {
    throw new Error(data.message || "Xac nhan loi moi that bai");
  }
  return data.data;
}

export async function declineInvitation(token: string) {
  const { data } = await apiClient.post<ApiResponse<TeamDetailResponse>>(
    "/v1/team-invitations/decline",
    { token }
  );
  if (!data.data) {
    throw new Error(data.message || "Tu choi loi moi that bai");
  }
  return data.data;
}

export async function fetchMyTeams(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<TeamDetailResponse[]>>(`/v1/my/teams?eventId=${eventId}`);
  return data.data ?? [];
}
