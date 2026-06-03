import { getDemoSession, getRoleHome, isDemoAuthenticated, type UserRole } from "../auth/demoSession";

export function useRoleGuard(allow: UserRole[]) {
  const session = getDemoSession();
  return {
    session,
    authenticated: isDemoAuthenticated(),
    allowed: allow.includes(session.role),
    home: getRoleHome(session.role)
  };
}
