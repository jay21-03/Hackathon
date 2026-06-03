import { useEffect, useState } from "react";
import { getDemoSession, roleLabels, setDemoRole, type UserRole } from "../../auth/demoSession";

const roles: UserRole[] = ["participant", "organizer", "mentor", "judge"];

export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const enabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_ROLE_SWITCHER === "true";
  const [role, setRole] = useState<UserRole>(() => getDemoSession().role);

  useEffect(() => {
    const sync = () => setRole(getDemoSession().role);
    window.addEventListener("seal-demo-session-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("seal-demo-session-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <label className={`flex items-center gap-2 ${compact ? "w-full" : ""}`}>
      {!compact && (
        <span className="font-label-sm normal-case text-on-surface-variant">Vai tro</span>
      )}
      <select
        value={role}
        onChange={(event) => {
          const nextRole = event.target.value as UserRole;
          setDemoRole(nextRole);
          setRole(nextRole);
        }}
        className={`rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-label-md text-on-surface focus:border-primary focus:outline-none ${
          compact ? "w-full" : ""
        }`}
      >
        {roles.map((item) => (
          <option key={item} value={item}>
            {roleLabels[item]}
          </option>
        ))}
      </select>
    </label>
  );
}
