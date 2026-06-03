import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern" />
      <Outlet />
    </div>
  );
}
