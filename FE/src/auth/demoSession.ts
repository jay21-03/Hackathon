import { clearAccessToken, getAccessToken, setAccessToken } from "./tokenStorage";

export type UserRole = "participant" | "organizer" | "mentor" | "judge";

export interface DemoSession {
  role: UserRole;
  email: string;
  name: string;
}

const storageKey = "seal.demo.session";
const authKey = "seal.demo.authenticated";
const devAuthBypassEnabled = import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === "true";

const roleProfiles: Record<UserRole, DemoSession> = {
  participant: {
    role: "participant",
    email: "participant@seal.edu.vn",
    name: "Thi sinh demo"
  },
  organizer: {
    role: "organizer",
    email: "organizer@seal.edu.vn",
    name: "Ban to chuc demo"
  },
  mentor: {
    role: "mentor",
    email: "mentor@seal.edu.vn",
    name: "Mentor demo"
  },
  judge: {
    role: "judge",
    email: "judge@seal.edu.vn",
    name: "Giam khao demo"
  }
};

export function getDemoSession(): DemoSession {
  if (typeof window === "undefined") return roleProfiles.participant;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return roleProfiles.participant;
  try {
    const parsed = JSON.parse(raw) as DemoSession;
    return parsed.role in roleProfiles ? parsed : roleProfiles.participant;
  } catch {
    return roleProfiles.participant;
  }
}

export function isDemoAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  if (getAccessToken()) return true;
  if (window.localStorage.getItem(authKey) !== "true") return false;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as DemoSession;
    return parsed.role in roleProfiles;
  } catch {
    return false;
  }
}

export function setDemoAuthenticated(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(authKey, "true");
  } else {
    window.localStorage.removeItem(authKey);
    if (devAuthBypassEnabled) {
      clearAccessToken();
    }
  }
}

function buildDevToken(role: UserRole, email: string) {
  return `dev:${role}:${email.trim().toLowerCase()}`;
}

export function setDemoRole(role: UserRole) {
  const next = roleProfiles[role];
  window.localStorage.setItem(storageKey, JSON.stringify(next));
  if (devAuthBypassEnabled) {
    setAccessToken(buildDevToken(role, next.email));
    setDemoAuthenticated(true);
  }
  window.dispatchEvent(new Event("seal-demo-session-change"));
  return next;
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
