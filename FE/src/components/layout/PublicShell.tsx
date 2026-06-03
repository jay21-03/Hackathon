import { NavLink, Outlet } from "react-router-dom";
import { RoleSwitcher } from "../auth/RoleSwitcher";
import { Icon } from "../ui/Icon";

export function PublicShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-outline-variant bg-surface/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-workspace flex-wrap items-center justify-between gap-sm px-page py-sm md:px-margin-desktop">
          <NavLink to="/events" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container">
              <Icon name="shield" filled className="text-[18px] text-on-primary-container" />
            </div>
            <div>
              <h1 className="font-headline-sm tracking-normal text-on-surface">SEAL Hackathon</h1>
              <p className="hidden font-label-sm normal-case text-on-surface-variant md:block">
                Cong quan ly cuoc thi
              </p>
            </div>
          </NavLink>

          <nav className="flex items-center gap-sm">
            <NavLink
              to="/events"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 font-label-md ${
                  isActive
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`
              }
            >
              Cuoc thi
            </NavLink>
            <NavLink
              to="/register"
              className="rounded-lg px-3 py-2 font-label-md text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
            >
              Dang ky doi
            </NavLink>
            <NavLink
              to="/organizer/dashboard"
              className="rounded-lg px-3 py-2 font-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            >
              Ban to chuc
            </NavLink>
            <RoleSwitcher />
          </nav>

          <NavLink
            to="/login"
            className="flex items-center gap-2 rounded-lg p-2 font-label-md text-primary hover:bg-surface-container-high md:px-4 md:py-2"
          >
            <Icon name="login" />
            <span className="hidden md:inline">Dang nhap</span>
          </NavLink>
        </div>
      </header>

      <main className="mx-auto w-full max-w-workspace flex-grow px-page py-lg md:px-margin-desktop md:py-xl md:pb-margin-desktop">
        <Outlet />
      </main>
    </div>
  );
}
