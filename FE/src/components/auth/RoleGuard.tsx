import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  getAuthSession,
  getRoleHome,
  isAuthenticated,
  roleLabels,
  SESSION_CHANGE_EVENT,
  type UserRole
} from "../../auth/authSession";
import { AccountApprovalGate } from "./AccountApprovalGate";
import { ProfileCompletionGate } from "./ProfileCompletionGate";

interface RoleGuardProps {
  allow: UserRole[];
  children?: ReactNode;
}

export function RoleGuard({ allow, children }: RoleGuardProps) {
  const location = useLocation();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const sync = () => setTick((value) => value + 1);
    window.addEventListener(SESSION_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SESSION_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const session = getAuthSession();
  void tick;

  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}`,
          message: "Vui lòng đăng nhập để tiếp tục."
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
          message: `Tài khoản hiện tại là ${roleLabels[session.role]}, không có quyền vào màn này.`
        }}
      />
    );
  }

  return (
    <ProfileCompletionGate>
      <AccountApprovalGate>{children ?? <Outlet />}</AccountApprovalGate>
    </ProfileCompletionGate>
  );
}
