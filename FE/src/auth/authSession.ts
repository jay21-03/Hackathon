import { clearAccessToken, getAccessToken } from "./tokenStorage";

export const SESSION_CHANGE_EVENT = "seal-session-change";

export type UserRole = "participant" | "organizer" | "mentor" | "judge";

export interface AuthSession {
  role: UserRole;
  email: string;
  name: string;
}

const storageKey = "seal.auth.session";

const defaultSession: AuthSession = {
  role: "participant",
  email: "",
  name: ""
};

export function getAuthSession(): AuthSession {
  if (typeof window === "undefined") return defaultSession;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return defaultSession;
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed.role) return defaultSession;
    return parsed;
  } catch {
    return defaultSession;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export function setAuthenticated(value: boolean) {
  if (typeof window === "undefined") return;
  if (!value) {
    clearAccessToken();
    window.localStorage.removeItem(storageKey);
  }
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function setAuthSession(input: { role: UserRole; email: string; name: string }) {
  const next: AuthSession = {
    role: input.role,
    email: input.email,
    name: input.name
  };
  window.localStorage.setItem(storageKey, JSON.stringify(next));
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  return next;
}

export function resolveRoleFromApiRoles(roles: string[] | undefined): UserRole {
  const normalized = (roles ?? []).map((role) => role.toUpperCase());
  if (normalized.includes("ORGANIZER")) return "organizer";
  if (normalized.includes("MENTOR")) return "mentor";
  if (normalized.includes("JUDGE")) return "judge";
  return "participant";
}

export function getRoleHome(role: UserRole) {
  if (role === "organizer") return "/organizer/dashboard";
  if (role === "mentor") return "/mentor/dashboard";
  if (role === "judge") return "/judge/dashboard";
  return "/events";
}

export const roleLabels: Record<UserRole, string> = {
  participant: "Thí sinh",
  organizer: "Ban tổ chức",
  mentor: "Mentor",
  judge: "Giám khảo"
};
