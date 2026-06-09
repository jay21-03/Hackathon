import type { ApiResponse } from "../types/api";

import type { PagedResult } from "../types/api";

import { apiClient } from "./apiClient";



export type StaffRole = "MENTOR" | "JUDGE";



export type StaffInvitationStatus = "INVITED" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";



export interface StaffInvitationResponse {

  id: number;

  boardId: number;

  boardName?: string | null;

  eventId?: number | null;

  eventName?: string | null;

  email: string;

  role: StaffRole;

  status: StaffInvitationStatus;

  invitedAt: string;

  inviteExpiresAt?: string | null;

  acceptedAt?: string | null;

  declinedAt?: string | null;

  resendCount?: number;

  lastResentAt?: string | null;

  emailOpenCount?: number;

  emailOpenedAt?: string | null;

  emailAcceptClickedAt?: string | null;

  emailDeclineClickedAt?: string | null;

}



export interface BulkStaffInvitationFailure {

  email: string;

  role?: StaffRole;

  reason: string;

}



export interface BulkStaffInvitationResponse {

  total: number;

  succeededCount: number;

  failedCount: number;

  succeeded: StaffInvitationResponse[];

  failed: BulkStaffInvitationFailure[];

}



export async function fetchStaffInvitations(

  eventId: number,

  params?: {

    boardId?: number | null;

    role?: StaffRole | null;

    status?: StaffInvitationStatus | null;

    email?: string | null;

    page?: number;

    size?: number;

  }

) {

  const usePaging = params?.page != null || params?.size != null;

  const { data } = await apiClient.get<ApiResponse<StaffInvitationResponse[] | PagedResult<StaffInvitationResponse>>>(

    `/v1/events/${eventId}/staff-invitations`,

    {

      params: {

        boardId: params?.boardId ?? undefined,

        role: params?.role ?? undefined,

        status: params?.status ?? undefined,

        email: params?.email?.trim() || undefined,

        page: usePaging ? (params?.page ?? 0) : undefined,

        size: usePaging ? (params?.size ?? 25) : undefined

      }

    }

  );

  if (usePaging) {

    const paged = data.data as PagedResult<StaffInvitationResponse>;

    return {

      items: paged?.items ?? [],

      total: paged?.total ?? 0,

      totalPages: paged?.totalPages ?? 0,

      page: paged?.page ?? 0

    };

  }

  const list = (data.data as StaffInvitationResponse[]) ?? [];

  return { items: list, total: list.length, totalPages: 1, page: 0 };

}



export async function createStaffInvitation(

  boardId: number,

  body: { email: string; role: StaffRole },

  idempotencyKey?: string

) {

  const { data } = await apiClient.post<ApiResponse<StaffInvitationResponse>>(

    `/v1/boards/${boardId}/staff-invitations`,

    body,

    idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : undefined

  );

  if (!data.data) {

    throw new Error(data.message || "Không gửi được lời mời.");

  }

  return data.data;

}



export async function createStaffInvitationsBulk(

  boardId: number,

  body: { defaultRole: StaffRole; items: Array<{ email: string; role?: StaffRole }> }

) {

  const { data } = await apiClient.post<ApiResponse<BulkStaffInvitationResponse>>(

    `/v1/boards/${boardId}/staff-invitations/bulk`,

    body

  );

  if (!data.data) {

    throw new Error(data.message || "Không gửi được lời mời hàng loạt.");

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



function parseRoleToken(token: string): StaffRole | undefined {

  const upper = token.toUpperCase();

  if (upper === "JUDGE" || upper === "GIAM KHAO" || upper === "GIÁM KHẢO") {

    return "JUDGE";

  }

  if (upper === "MENTOR") {

    return "MENTOR";

  }

  return undefined;

}



/** Parse textarea/CSV: one email per line, optional `email,ROLE` */

export function parseBulkStaffEmails(text: string): Array<{ email: string; role?: StaffRole }> {

  return text

    .split(/[\r\n]+/)

    .map((line) => line.trim())

    .filter(Boolean)

    .map((line) => {

      const parts = line.split(/[,\t]/).map((p) => p.trim()).filter(Boolean);

      const email = parts[0] ?? "";

      const role = parts[1] ? parseRoleToken(parts[1]) : undefined;

      return { email, role };

    })

    .filter((item) => item.email.includes("@"));

}

