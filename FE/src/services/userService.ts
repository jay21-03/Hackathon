import type { ApiResponse, PagedResult } from "../types/api";
import { apiClient } from "./apiClient";
import type { CurrentUserResponse } from "./profileService";

export interface UserSummaryResponse {
  id: number;
  email: string;
  fullName: string;
  studentType?: "FPT" | "EXTERNAL" | null;
  studentId?: string | null;
  university?: string | null;
  status: string;
  roles: string[];
  createdAt: string;
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get<ApiResponse<CurrentUserResponse>>("/v1/me");
  if (!data.data) {
    throw new Error(data.message || "Không tải được thông tin người dùng");
  }
  return data.data;
}

export async function fetchAdminUsers(params?: { page?: number; size?: number; q?: string }) {
  const { data } = await apiClient.get<ApiResponse<PagedResult<UserSummaryResponse>>>(
    "/v1/admin/users",
    {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 100,
        ...(params?.q?.trim() ? { q: params.q.trim() } : {})
      }
    }
  );
  return (
    data.data ?? {
      items: [],
      page: 0,
      size: params?.size ?? 100,
      total: 0,
      totalPages: 0
    }
  );
}

export async function updateUserApproval(
  userId: number,
  action: "APPROVE" | "REJECT"
) {
  const { data } = await apiClient.patch<ApiResponse<UserSummaryResponse>>(
    `/v1/admin/users/${userId}/approval`,
    { action }
  );
  if (!data.data) {
    throw new Error(data.message || "Cập nhật duyệt tài khoản thất bại");
  }
  return data.data;
}

export async function assignUserRole(userId: number, role: "ORGANIZER" | "MENTOR" | "JUDGE") {
  const { data } = await apiClient.post<ApiResponse<UserSummaryResponse>>(
    `/v1/admin/users/${userId}/roles`,
    { role }
  );
  if (!data.data) {
    throw new Error(data.message || "Gán vai trò thất bại");
  }
  return data.data;
}
