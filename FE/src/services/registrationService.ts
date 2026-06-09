import type { ApiResponse, PagedResult } from "../types/api";
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
    studentId?: string;
    university?: string;
    status: string;
    contactPerson?: boolean;
    invitedAt?: string | null;
    confirmedAt?: string | null;
  }>;
  confirmedAt?: string | null;
  rejectedReason?: string | null;
}

export async function fetchEventTeams(eventId: number): Promise<TeamDetailResponse[]>;
export async function fetchEventTeams(
  eventId: number,
  options: { page?: number; size?: number; status?: string }
): Promise<PagedResult<TeamDetailResponse>>;
export async function fetchEventTeams(
  eventId: number,
  options?: { page?: number; size?: number; status?: string }
): Promise<TeamDetailResponse[] | PagedResult<TeamDetailResponse>> {
  const { data } = await apiClient.get<ApiResponse<PagedResult<TeamDetailResponse>>>(
    `/v1/events/${eventId}/teams`,
    { params: options }
  );
  const paged =
    data.data ?? {
      items: [],
      page: 0,
      size: 0,
      total: 0,
      totalPages: 0
    };
  return options ? paged : paged.items;
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
    throw new Error(data.message || "Gửi lại lời mời thất bại");
  }
  return data.data;
}

export interface InviteTeamMemberPayload {
  email: string;
  fullName: string;
  studentId?: string;
  university?: string;
}

export async function inviteTeamMember(
  teamId: number,
  member: InviteTeamMemberPayload,
  options?: { idempotencyKey?: string }
) {
  const headers: Record<string, string> = {};
  if (options?.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }
  const { data } = await apiClient.post<ApiResponse<TeamDetailResponse>>(
    `/v1/teams/${teamId}/members`,
    { member },
    Object.keys(headers).length ? { headers } : undefined
  );
  if (!data.data) {
    throw new Error(data.message || "Mời thành viên thất bại");
  }
  return data.data;
}

export async function cancelPendingInvitation(teamId: number, memberId: number) {
  const { data } = await apiClient.delete<ApiResponse<TeamDetailResponse>>(
    `/v1/teams/${teamId}/members/${memberId}`
  );
  if (!data.data) {
    throw new Error(data.message || "Huỷ lời mời thất bại");
  }
  return data.data;
}

export async function registerTeam(
  eventId: number,
  payload: RegisterTeamPayload,
  options?: { idempotencyKey?: string }
) {
  const headers: Record<string, string> = {};
  if (options?.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }
  const { data } = await apiClient.post<ApiResponse<TeamDetailResponse>>(
    `/v1/events/${eventId}/teams`,
    payload,
    Object.keys(headers).length ? { headers } : undefined
  );
  if (!data.data) {
    throw new Error(data.message || "Đăng ký đội thất bại");
  }
  return data.data;
}

export async function confirmInvitation(token: string) {
  const { data } = await apiClient.post<ApiResponse<TeamDetailResponse>>(
    "/v1/team-invitations/confirm",
    { token }
  );
  if (!data.data) {
    throw new Error(data.message || "Xác nhận lời mời thất bại");
  }
  return data.data;
}

export async function declineInvitation(token: string) {
  const { data } = await apiClient.post<ApiResponse<TeamDetailResponse>>(
    "/v1/team-invitations/decline",
    { token }
  );
  if (!data.data) {
    throw new Error(data.message || "Từ chối lời mời thất bại");
  }
  return data.data;
}

export async function fetchMyTeams(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<TeamDetailResponse[]>>(`/v1/my/teams?eventId=${eventId}`);
  return data.data ?? [];
}

export async function fetchTeam(teamId: number) {
  const { data } = await apiClient.get<ApiResponse<TeamDetailResponse>>(`/v1/teams/${teamId}`);
  if (!data.data) {
    throw new Error(data.message || "Không tải được thông tin đội");
  }
  return data.data;
}

export type TeamInvitationStatus = "INVITED" | "CONFIRMED" | "DECLINED" | "EXPIRED";

export interface TeamInvitationResponse {
  id: number;
  teamId: number;
  teamName?: string | null;
  eventId: number;
  email: string;
  fullName: string;
  status: string;
  invitedAt?: string | null;
  inviteExpiresAt?: string | null;
  confirmedAt?: string | null;
  declinedAt?: string | null;
  resendCount?: number;
  lastResentAt?: string | null;
  expired?: boolean;
  emailOpenCount?: number;
  emailOpenedAt?: string | null;
  emailAcceptClickedAt?: string | null;
  emailDeclineClickedAt?: string | null;
}

export interface BulkTeamInvitationFailure {
  email: string;
  reason: string;
}

export interface BulkTeamInvitationResponse {
  total: number;
  succeededCount: number;
  failedCount: number;
  team?: TeamDetailResponse;
  failed: BulkTeamInvitationFailure[];
}

export async function fetchTeamInvitations(
  eventId: number,
  params?: {
    status?: TeamInvitationStatus | null;
    email?: string | null;
    page?: number;
    size?: number;
  }
) {
  const { data } = await apiClient.get<ApiResponse<PagedResult<TeamInvitationResponse>>>(
    `/v1/events/${eventId}/team-invitations`,
    {
      params: {
        status: params?.status ?? undefined,
        email: params?.email?.trim() || undefined,
        page: params?.page ?? 0,
        size: params?.size ?? 25
      }
    }
  );
  const paged = data.data;
  return {
    items: paged?.items ?? [],
    total: paged?.total ?? 0,
    totalPages: paged?.totalPages ?? 0,
    page: paged?.page ?? 0
  };
}

export async function bulkInviteTeamMembers(
  teamId: number,
  members: InviteTeamMemberPayload[]
) {
  const { data } = await apiClient.post<ApiResponse<BulkTeamInvitationResponse>>(
    `/v1/teams/${teamId}/members/bulk`,
    { members }
  );
  if (!data.data) {
    throw new Error(data.message || "Mời hàng loạt thất bại");
  }
  return data.data;
}

/** Parse one email per line; optional `email,Tên` */
export function parseBulkMemberEmails(text: string): InviteTeamMemberPayload[] {
  return text
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,\t]/).map((p) => p.trim());
      const email = parts[0] ?? "";
      const fullName = parts[1] || email.split("@")[0] || email;
      return { email, fullName };
    })
    .filter((item) => item.email.includes("@"));
}
