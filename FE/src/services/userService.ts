import type { ApiResponse } from "../types/api";
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
    throw new Error(data.message || "Khong tai duoc thong tin nguoi dung");
  }
  return data.data;
}

export async function fetchAdminUsers() {
  const { data } = await apiClient.get<ApiResponse<UserSummaryResponse[]>>("/v1/admin/users");
  return data.data ?? [];
}

export async function assignUserRole(userId: number, role: "ORGANIZER" | "MENTOR" | "JUDGE") {
  const { data } = await apiClient.post<ApiResponse<UserSummaryResponse>>(
    `/v1/admin/users/${userId}/roles`,
    { role }
  );
  if (!data.data) {
    throw new Error(data.message || "Gan vai tro that bai");
  }
  return data.data;
}
