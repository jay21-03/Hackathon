import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";

export type StaffRole = "MENTOR" | "JUDGE";

export interface StaffInvitationResponse {
  id: number;
  boardId: number;
  boardName?: string | null;
  eventId?: number | null;
  eventName?: string | null;
  email: string;
  role: StaffRole;
  status: string;
  invitedAt: string;
  inviteExpiresAt?: string | null;
}

export async function fetchStaffInvitations(
  eventId: number,
  params?: { boardId?: number | null; role?: StaffRole | null }
) {
  const { data } = await apiClient.get<ApiResponse<StaffInvitationResponse[]>>(
    `/v1/events/${eventId}/staff-invitations`,
    {
      params: {
        boardId: params?.boardId ?? undefined,
        role: params?.role ?? undefined
      }
    }
  );
  return data.data ?? [];
}

export async function createStaffInvitation(boardId: number, body: { email: string; role: StaffRole }) {
  const { data } = await apiClient.post<ApiResponse<StaffInvitationResponse>>(
    `/v1/boards/${boardId}/staff-invitations`,
    body
  );
  if (!data.data) {
    throw new Error(data.message || "Không gửi được lời mời.");
  }
  return data.data;
}

export async function resendStaffInvitation(staffInvitationId: number) {
  const { data } = await apiClient.post<ApiResponse<StaffInvitationResponse>>(
    "/v1/staff-invitations/resend",
    { staffInvitationId }
  );
  if (!data.data) {
    throw new Error(data.message || "Không gửi lại được lời mời.");
  }
  return data.data;
}

export async function acceptStaffInvitation(token: string) {
  const { data } = await apiClient.post<ApiResponse<StaffInvitationResponse>>(
    "/v1/staff-invitations/accept",
    { token }
  );
  if (!data.data) {
    throw new Error(data.message || "Không xác nhận được lời mời.");
  }
  return data.data;
}

export async function declineStaffInvitation(token: string) {
  await apiClient.post("/v1/staff-invitations/decline", { token });
}
