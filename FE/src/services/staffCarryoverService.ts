import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";
import type { StaffRole } from "./staffInvitationService";

export interface StaffCarryoverFailure {
  userId: number;
  role?: StaffRole;
  reason: string;
}

export interface StaffCarryoverSuccess {
  userId: number;
  email: string;
  fullName: string;
  role: StaffRole;
}

export interface StaffCarryoverResponse {
  total: number;
  succeededCount: number;
  failedCount: number;
  succeeded: StaffCarryoverSuccess[];
  failed: StaffCarryoverFailure[];
}

export async function carryoverStaffForEvent(
  eventId: number,
  body: {
    sourceTermId?: number;
    defaultRole: StaffRole;
    items: Array<{ userId: number; role?: StaffRole }>;
  }
) {
  const { data } = await apiClient.post<ApiResponse<StaffCarryoverResponse>>(
    `/v1/events/${eventId}/staff-carryover`,
    body
  );
  if (!data.data) {
    throw new Error(data.message || "Không chuyển được staff sang kỳ mới.");
  }
  return data.data;
}
