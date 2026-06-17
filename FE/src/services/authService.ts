import axios from "axios";

import type { ApiResponse } from "../types/api";

import type { CurrentUserResponse } from "./profileService";

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

  user: CurrentUserResponse;

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



export async function registerAccount(payload: {
  email: string;
  password: string;
  fullName: string;
  studentType?: "FPT" | "EXTERNAL";
  studentId?: string;
  university?: string;
  githubUsername?: string;
}) {

  try {

    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(

      "/v1/auth/register",

      payload

    );

    if (!data.data?.accessToken) {

      throw new Error(data.message || "Đăng ký thất bại");

    }

    return data.data;

  } catch (error) {

    throw toAuthError(error, "Đăng ký thất bại");

  }

}



export async function loginWithPassword(payload: { email: string; password: string }) {

  try {

    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(

      "/v1/auth/login",

      payload

    );

    if (!data.data?.accessToken) {

      throw new Error(data.message || "Đăng nhập thất bại");

    }

    return data.data;

  } catch (error) {

    throw toAuthError(error, "Đăng nhập thất bại");

  }

}



export async function requestPasswordReset(email: string) {
  try {
    const { data } = await apiClient.post<
      ApiResponse<{ message: string; devResetUrl?: string }>
    >(
      "/v1/auth/forgot-password",
      { email }
    );
    if (!data.data?.message) {
      throw new Error(data.message || "Gửi email thất bại");
    }
    return data.data;
  } catch (error) {
    throw toAuthError(error, "Gửi email thất bại");
  }
}

export async function resetPasswordWithToken(payload: { token: string; newPassword: string }) {
  try {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
      "/v1/auth/reset-password",
      payload
    );
    if (!data.data?.message) {
      throw new Error(data.message || "Đặt lại mật khẩu thất bại");
    }
    return data.data;
  } catch (error) {
    throw toAuthError(error, "Đặt lại mật khẩu thất bại");
  }
}

export async function setMyPassword(payload: {

  currentPassword?: string;

  newPassword: string;

}) {

  try {

    const { data } = await apiClient.put<ApiResponse<CurrentUserResponse>>(

      "/v1/me/password",

      payload

    );

    if (!data.data) {

      throw new Error(data.message || "Đặt mật khẩu thất bại");

    }

    return data.data;

  } catch (error) {

    throw toAuthError(error, "Đặt mật khẩu thất bại");

  }

}


