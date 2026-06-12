import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  getAuthSession,
  isAuthenticated,
  setAuthSession
} from "../../auth/authSession";
import { fetchCurrentUser } from "../../services/userService";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";

interface ProfileCompletionGateProps {
  children?: ReactNode;
}

export function ProfileCompletionGate({ children }: ProfileCompletionGateProps) {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [incomplete, setIncomplete] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      setIncomplete(false);
      setReady(true);
      return;
    }

    const session = getAuthSession();
    if (session.profileCompleted === true) {
      setIncomplete(false);
      setReady(true);
      return;
    }

    let active = true;
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
      .catch(() => {
        if (active) setIncomplete(false);
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  if (!ready) {
    return <ModuleSkeleton rows={4} />;
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
