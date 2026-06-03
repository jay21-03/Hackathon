import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getDemoSession, getRoleHome, roleLabels, type UserRole } from "../../auth/demoSession";

interface RoleGuardProps {
  allow: UserRole[];
}

export function RoleGuard({ allow }: RoleGuardProps) {
  const location = useLocation();
  const session = getDemoSession();

  if (!allow.includes(session.role)) {
    return (
      <Navigate
        to={getRoleHome(session.role)}
        replace
        state={{
          from: location.pathname,
          message: `Tai khoan demo hien la ${roleLabels[session.role]}, khong co quyen vao man nay.`
        }}
      />
    );
  }

  return <Outlet />;
}
