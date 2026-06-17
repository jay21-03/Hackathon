import type { UserRole } from "../auth/authSession";

const STAFF_API_ROLES = new Set(["ORGANIZER", "MENTOR", "JUDGE"]);
const MENTOR_JUDGE_API_ROLES = new Set(["MENTOR", "JUDGE"]);

export function isStaffApiRole(roles: string[] | undefined): boolean {
  return (roles ?? []).some((role) => STAFF_API_ROLES.has(role.toUpperCase()));
}

export function isMentorOrJudgeApiRole(roles: string[] | undefined): boolean {
  return (roles ?? []).some((role) => MENTOR_JUDGE_API_ROLES.has(role.toUpperCase()));
}

export function isStaffSessionRole(role: UserRole): boolean {
  return role === "organizer" || role === "mentor" || role === "judge";
}

export function isMentorOrJudgeSessionRole(role: UserRole): boolean {
  return role === "mentor" || role === "judge";
}

export function isOrganizerSessionRole(role: UserRole): boolean {
  return role === "organizer";
}
