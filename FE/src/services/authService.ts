import axios from "axios";
import type { ApiResponse } from "../types/api";
import type { User } from "../types/entities";
import { apiClient } from "./apiClient";

function toAuthError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as ApiResponse<unknown> | undefined)?.message;
    if (message) return new Error(message);
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export async function googleLogin(idToken: string) {
  try {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      "/v1/auth/google-login",
      { idToken }
    );
    if (!data.data?.accessToken) {
      throw new Error(data.message || "Google login failed");
    }
    return data.data;
  } catch (error) {
    throw toAuthError(error, "Google login failed");
  }
}
