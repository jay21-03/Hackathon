import type { ApiResponse } from "../types/api";
import type { User } from "../types/entities";
import { withApiFallback } from "./apiFallback";
import { apiClient } from "./apiClient";
import { demoTeamMembers } from "./readModelService";

export interface CurrentUserResponse {
  id: number;
  email: string;
  fullName: string;
  studentId?: string;
  university?: string;
  avatarUrl?: string;
  status?: string;
  roles?: string[];
}

const fallbackProfile: CurrentUserResponse = {
  id: 0,
  email: demoTeamMembers[0]?.email ?? "participant@seal.edu.vn",
  fullName: demoTeamMembers[0]?.fullName ?? "Thi sinh demo",
  studentId: "",
  university: "",
  avatarUrl: "",
  status: "ACTIVE",
  roles: ["PARTICIPANT"]
};

export async function fetchMyProfile() {
  return withApiFallback(async () => {
    const { data } = await apiClient.get<ApiResponse<CurrentUserResponse>>("/v1/me");
    return data.data ?? fallbackProfile;
  }, fallbackProfile);
}

export async function updateMyProfile(payload: {
  fullName: string;
  studentId?: string;
  university?: string;
  avatarUrl?: string;
}) {
  return withApiFallback(async () => {
    const { data } = await apiClient.put<ApiResponse<CurrentUserResponse>>(
      "/v1/me/profile",
      payload
    );
    return data.data ?? fallbackProfile;
  }, { ...fallbackProfile, ...payload });
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
