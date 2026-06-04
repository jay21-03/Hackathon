import { NavLink, Outlet } from "react-router-dom";
import {
  getAuthSession,
  getRoleHome,
  isAuthenticated,
  roleLabels,
  setAuthenticated
} from "../../auth/authSession";
import { Icon } from "../ui/Icon";
import { ThemeToggle } from "../ui/ThemeToggle";

export function PublicShell() {
  const authenticated = isAuthenticated();
  const session = getAuthSession();
  const homeLabel = roleLabels[session.role];

  function handleLogout() {
    setAuthenticated(false);
    window.location.href = "/events";
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-outline-variant/60 bg-surface/90 shadow-ambient backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-workspace flex-wrap items-center justify-between gap-sm px-page py-sm md:px-margin-desktop">
          <NavLink to="/events" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container">
              <Icon name="shield" filled className="text-[18px] text-on-primary-container" />
            </div>
            <div>
              <h1 className="font-headline-sm tracking-normal text-on-surface">SEAL Hackathon</h1>
              <p className="hidden font-label-sm normal-case text-on-surface-variant md:block">
                Cổng quản lý cuộc thi
              </p>
            </div>
          </NavLink>

          <div className="ml-auto flex items-center gap-sm">
            <ThemeToggle />
            {authenticated && session.role === "participant" ? (
              <NavLink
                to="/register"
                className="rounded-lg px-3 py-2 font-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              >
                Đăng ký đội
              </NavLink>
            ) : null}

            {authenticated ? (
              <>
                <NavLink
                  to={getRoleHome(session.role)}
                  className="flex items-center gap-2 rounded-lg p-2 font-label-md text-primary hover:bg-surface-container-high md:px-4 md:py-2"
                >
                  <Icon name="dashboard" className="text-[20px]" />
                  <span className="hidden md:inline">{`Vào trang ${homeLabel}`}</span>
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg p-2 font-label-md text-on-surface-variant hover:bg-surface-container-high md:px-4 md:py-2"
                >
                  <Icon name="logout" className="text-[20px]" />
                  <span className="hidden md:inline">Đăng xuất</span>
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="flex items-center gap-2 rounded-lg p-2 font-label-md text-primary hover:bg-surface-container-high md:px-4 md:py-2"
              >
                <Icon name="account_circle" className="text-[20px]" />
                <span className="hidden md:inline">Đăng nhập</span>
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-workspace flex-grow px-page py-lg md:px-margin-desktop md:py-xl md:pb-margin-desktop">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-grid-pattern opacity-80" />
        <Outlet />
      </main>
    </div>
  );
}
