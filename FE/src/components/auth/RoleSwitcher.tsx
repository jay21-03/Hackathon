import { useEffect, useState } from "react";
import {
  getAuthSession,
  roleLabels,
  SESSION_CHANGE_EVENT,
  setAuthSession,
  type UserRole
} from "../../auth/authSession";

export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const enabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_ROLE_SWITCHER === "true";
  const [role, setRole] = useState<UserRole>(() => getAuthSession().role);

  useEffect(() => {
    const sync = () => setRole(getAuthSession().role);
    window.addEventListener(SESSION_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SESSION_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!enabled) return null;

  return (
    <label className={`flex flex-col gap-xs ${compact ? "text-xs" : ""}`}>
      <span className="font-label-sm normal-case text-on-surface-variant">Dev: đổi vai trò UI</span>
      <select
        value={role}
        onChange={(event) => {
          const next = event.target.value as UserRole;
          const current = getAuthSession();
          setAuthSession({
            role: next,
            email: current.email,
            name: current.name
          });
          setRole(next);
        }}
        className="rounded-lg border border-outline-variant bg-surface-container-high px-2 py-1 font-label-md text-on-surface"
      >
        {(Object.keys(roleLabels) as UserRole[]).map((key) => (
          <option key={key} value={key}>
            {roleLabels[key]}
          </option>
        ))}
      </select>
    </label>
  );
}
