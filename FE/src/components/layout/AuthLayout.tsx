import { Outlet } from "react-router-dom";
import { ThemeToggle } from "../ui/ThemeToggle";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern" />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle showLabel />
      </div>
      <Outlet />
    </div>
  );
}
