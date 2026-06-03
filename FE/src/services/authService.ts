import type { ApiResponse } from "../types/api";
import type { User } from "../types/entities";
import { apiClient } from "./apiClient";

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export async function googleLogin(idToken: string) {
  const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
    "/v1/auth/google-login",
    { idToken }
  );
  if (!data.data?.accessToken) {
    throw new Error(data.message || "Google login failed");
  }
  return data.data;
}
