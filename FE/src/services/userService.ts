import type { ApiResponse, PagedResult } from "../types/api";
import { apiClient } from "./apiClient";
import type { CurrentUserResponse } from "./profileService";

export interface UserSummaryResponse {
  id: number;
  email: string;
  fullName: string;
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

export async function fetchAdminUsers(params?: { page?: number; size?: number }) {
  const { data } = await apiClient.get<ApiResponse<PagedResult<UserSummaryResponse>>>(
    "/v1/admin/users",
    { params: { page: params?.page ?? 0, size: params?.size ?? 100 } }
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
