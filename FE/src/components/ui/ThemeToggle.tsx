import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, toggleTheme, type ThemeMode } from "../../theme/theme";
import { Icon } from "./Icon";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  return (
    <button
      type="button"
      onClick={() => setMode(toggleTheme())}
      className={`flex items-center gap-2 rounded-lg p-2 font-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface ${className}`}
      aria-label={mode === "dark" ? "Bật giao diện sáng" : "Bật giao diện tối"}
      title={mode === "dark" ? "Giao diện sáng" : "Giao diện tối"}
    >
      <Icon name={mode === "dark" ? "light_mode" : "dark_mode"} className="text-[20px]" />
      {showLabel ? (
        <span className="hidden md:inline">{mode === "dark" ? "Sáng" : "Tối"}</span>
      ) : null}
    </button>
  );
}
