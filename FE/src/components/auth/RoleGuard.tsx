import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getDemoSession,
  getRoleHome,
  isDemoAuthenticated,
  roleLabels,
  type UserRole
} from "../../auth/demoSession";

interface RoleGuardProps {
  allow: UserRole[];
}

export function RoleGuard({ allow }: RoleGuardProps) {
  const location = useLocation();
  const [sessionVersion, setSessionVersion] = useState(0);

  useEffect(() => {
    const sync = () => setSessionVersion((value) => value + 1);
    window.addEventListener("seal-demo-session-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("seal-demo-session-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const session = getDemoSession();
  void sessionVersion;

  if (!isDemoAuthenticated()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          message: "Vui long dang nhap de tiep tuc."
        }}
      />
    );
  }

  if (!allow.includes(session.role)) {
    return (
      <Navigate
        to={getRoleHome(session.role)}
        replace
        state={{
          from: location.pathname,
          message: `Tai khoan hien tai la ${roleLabels[session.role]}, khong co quyen vao man nay.`
        }}
      />
    );
  }

  return <Outlet />;
}
