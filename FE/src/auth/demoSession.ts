import { clearAccessToken, getAccessToken } from "./tokenStorage";

export type UserRole = "participant" | "organizer" | "mentor" | "judge";

export interface DemoSession {
  role: UserRole;
  email: string;
  name: string;
}

const storageKey = "seal.demo.session";

const defaultSession: DemoSession = {
  role: "participant",
  email: "",
  name: ""
};

export function getDemoSession(): DemoSession {
  if (typeof window === "undefined") return defaultSession;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return defaultSession;
  try {
    const parsed = JSON.parse(raw) as DemoSession;
    if (!parsed.role) return defaultSession;
    return parsed;
  } catch {
    return defaultSession;
  }
}

export function isDemoAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export function setDemoAuthenticated(value: boolean) {
  if (typeof window === "undefined") return;
  if (!value) {
    clearAccessToken();
    window.localStorage.removeItem(storageKey);
  }
  window.dispatchEvent(new Event("seal-demo-session-change"));
}

export function setDemoSessionFromUser(input: { role: UserRole; email: string; name: string }) {
  const next: DemoSession = {
    role: input.role,
    email: input.email,
    name: input.name
  };
  window.localStorage.setItem(storageKey, JSON.stringify(next));
  window.dispatchEvent(new Event("seal-demo-session-change"));
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
  return "/me";
}

export const roleLabels: Record<UserRole, string> = {
  participant: "Thi sinh",
  organizer: "Ban to chuc",
  mentor: "Mentor",
  judge: "Giam khao"
};
