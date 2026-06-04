import axios from "axios";
import { getAccessToken } from "../auth/tokenStorage";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

export const apiClient = axios.create({
  baseURL,
  timeout: 15000
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (!path.startsWith("/login") && !path.startsWith("/events")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);
