import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  getAuthSession,
  isAuthenticated,
  setAuthSession
} from "../../auth/authSession";
import { fetchCurrentUser } from "../../services/userService";
import { isUnauthorizedApiError } from "../../utils/apiError";
import { RetryPanel } from "../feedback/RetryPanel";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";

interface ProfileCompletionGateProps {
  children?: ReactNode;
}

export function ProfileCompletionGate({ children }: ProfileCompletionGateProps) {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [incomplete, setIncomplete] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) {
      setIncomplete(false);
      setFetchError(null);
      setReady(true);
      return;
    }

    const session = getAuthSession();
    if (session.profileCompleted === true) {
      setIncomplete(false);
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
        const profileCompleted = user.profileCompleted !== false;
        setAuthSession({
          ...session,
          name: user.fullName || session.name,
          profileCompleted
        });
        setIncomplete(!profileCompleted);
      })
      .catch((error) => {
        if (active && !isUnauthorizedApiError(error)) {
          setFetchError("Không kiểm tra được hồ sơ. Vui lòng thử lại.");
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

  if (incomplete) {
    return (
      <Navigate
        to="/login/complete-profile"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return children ?? <Outlet />;
}
