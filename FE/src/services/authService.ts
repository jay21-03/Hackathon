import type { ApiResponse } from "../types/api";
import type { User } from "../types/entities";
import { withApiFallback } from "./apiFallback";
import { apiClient } from "./apiClient";

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

function buildFallbackAuth(email: string): AuthResponse {
  return {
    accessToken: `demo-token-${email}`,
    tokenType: "Bearer",
    expiresIn: 3600,
    user: {
      id: 0,
      email,
      fullName: "Demo User",
      status: "ACTIVE"
    }
  };
}

export async function googleLogin(idToken: string, email: string) {
  const fallback = buildFallbackAuth(email);
  return withApiFallback(async () => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      "/v1/auth/google-login",
      { idToken }
    );
    return data.data ?? fallback;
  }, fallback);
}
