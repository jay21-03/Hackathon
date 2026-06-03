import { getDemoSession, getRoleHome, type UserRole } from "../auth/demoSession";

export function useRoleGuard(allow: UserRole[]) {
  const session = getDemoSession();
  return {
    session,
    allowed: allow.includes(session.role),
    home: getRoleHome(session.role)
  };
}
