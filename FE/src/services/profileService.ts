import type { ApiResponse } from "../types/api";
import type { User } from "../types/entities";
import { apiClient } from "./apiClient";

export interface CurrentUserResponse {
  id: number;
  email: string;
  username?: string | null;
  fullName: string;
  studentId?: string;
  university?: string;
  avatarUrl?: string;
  status?: string;
  profileCompleted?: boolean;
  hasPassword?: boolean;
  roles?: string[];
}

export async function fetchMyProfile() {
  const { data } = await apiClient.get<ApiResponse<CurrentUserResponse>>("/v1/me");
  if (!data.data) {
    throw new Error(data.message || "Không tải được hồ sơ");
  }
  return data.data;
}

export async function updateMyProfile(payload: {
  fullName: string;
  studentId?: string;
  university?: string;
  avatarUrl?: string;
}) {
  const { data } = await apiClient.put<ApiResponse<CurrentUserResponse>>("/v1/me/profile", payload);
  if (!data.data) {
    throw new Error(data.message || "Cập nhật hồ sơ thất bại");
  }
  return data.data;
}

export function mapUserToProfile(user: User): CurrentUserResponse {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName ?? "",
    studentId: user.studentId,
    university: user.university,
    status: user.status
  };
}
