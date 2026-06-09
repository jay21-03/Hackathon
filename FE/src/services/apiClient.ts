import axios from "axios";
import { setAuthenticated } from "../auth/authSession";
import { getAccessToken } from "../auth/tokenStorage";
import { getApiErrorMessage } from "../utils/apiError";

export const AUTH_UNAUTHORIZED_EVENT = "seal-auth-unauthorized";

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

const PUBLIC_401_PATH_PREFIXES = [
  "/login",
  "/events",
  "/team-invitations",
  "/team-invitation",
  "/register"
];

function shouldRedirectOn401(path: string) {
  return !PUBLIC_401_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (shouldRedirectOn401(path)) {
        setAuthenticated(false);
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
        if (!path.startsWith("/login")) {
          window.location.assign(`/login?next=${encodeURIComponent(path)}`);
        }
      }
    }
    const wrapped = error instanceof Error ? error : new Error(getApiErrorMessage(error));
    if (axios.isAxiosError(error) && error.response?.data) {
      const msg = getApiErrorMessage(error);
      wrapped.message = msg;
    }
    return Promise.reject(wrapped);
  }
);
