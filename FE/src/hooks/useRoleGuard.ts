import { getAuthSession, getRoleHome, isAuthenticated, type UserRole } from "../auth/authSession";

export function useRoleGuard(allow: UserRole[]) {
  const session = getAuthSession();
  return {
    session,
    authenticated: isAuthenticated(),
    allowed: allow.includes(session.role),
    home: getRoleHome(session.role)
  };
}
