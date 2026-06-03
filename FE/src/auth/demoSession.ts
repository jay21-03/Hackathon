export type UserRole = "participant" | "organizer" | "mentor" | "judge";

export interface DemoSession {
  role: UserRole;
  email: string;
  name: string;
}

const storageKey = "seal.demo.session";

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

export function setDemoRole(role: UserRole) {
  const next = roleProfiles[role];
  window.localStorage.setItem(storageKey, JSON.stringify(next));
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
