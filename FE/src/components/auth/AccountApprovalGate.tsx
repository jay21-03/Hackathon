import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAuthSession, isAuthenticated, setAuthSession } from "../../auth/authSession";
import { fetchCurrentUser } from "../../services/userService";
import { RetryPanel } from "../feedback/RetryPanel";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";
import { isStaffInvitationActionPath } from "../../utils/staffInvitationPaths";
import { isStaffApiRole } from "../../utils/staffRoles";

function isStaffRole(roles: string[] | undefined): boolean {
  return isStaffApiRole(roles);
}

interface AccountApprovalGateProps {
  children?: ReactNode;
}

export function AccountApprovalGate({ children }: AccountApprovalGateProps) {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) {
      setPending(false);
      setFetchError(null);
      setReady(true);
      return;
    }

    let active = true;
    setReady(false);
    setFetchError(null);

    fetchCurrentUser()
      .then((user) => {
        if (!active) return;
        const session = getAuthSession();
        setAuthSession({
          ...session,
          name: user.fullName || session.name,
          profileCompleted: user.profileCompleted !== false
        });
        if (isStaffRole(user.roles)) {
          setPending(false);
          return;
        }
        setPending(user.status === "PENDING_APPROVAL");
      })
      .catch(() => {
        if (active) {
          setFetchError("Không kiểm tra được trạng thái tài khoản. Vui lòng thử lại.");
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, [location.pathname, retryKey]);

  if (!ready) {
    return <ModuleSkeleton rows={4} />;
  }

  if (fetchError) {
    return (
      <div className="p-page">
        <RetryPanel
          message={fetchError}
          onRetry={() => {
            setFetchError(null);
            setRetryKey((value) => value + 1);
          }}
        />
      </div>
    );
  }

  if (pending && !isStaffInvitationActionPath(location.pathname)) {
    return (
      <Navigate
        to="/login/pending-approval"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return children ?? <Outlet />;
}
