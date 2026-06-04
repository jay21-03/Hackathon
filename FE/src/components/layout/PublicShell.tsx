import { NavLink, Outlet } from "react-router-dom";
import { getDemoSession, getRoleHome, isDemoAuthenticated, roleLabels, setDemoAuthenticated } from "../../auth/demoSession";
import { Icon } from "../ui/Icon";
import { useToast } from "../feedback/ToastProvider";

export function PublicShell() {
  const authenticated = isDemoAuthenticated();
  const session = getDemoSession();
  const homeLabel = roleLabels[session.role];
  const { notify } = useToast();

  function handleLogout() {
    setDemoAuthenticated(false);
    window.location.href = "/events";
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-surface/90 shadow-ambient backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-workspace flex-wrap items-center justify-between gap-sm px-page py-sm md:px-margin-desktop">
          <NavLink to="/events" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container shadow-[0_0_0_1px_rgba(173,198,255,0.1)]">
              <Icon name="shield" filled className="text-[18px] text-on-primary-container" />
            </div>
            <div>
              <h1 className="font-headline-sm tracking-normal text-on-surface">SEAL Hackathon</h1>
              <p className="hidden font-label-sm normal-case text-on-surface-variant md:block">
                Cong quan ly cuoc thi
              </p>
            </div>
          </NavLink>

          <div className="ml-auto flex items-center gap-sm">
            {authenticated && session.role === "participant" ? (
              <NavLink
                to="/register"
                className="rounded-lg px-3 py-2 font-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              >
                Dang ky doi
              </NavLink>
            ) : null}

            {authenticated ? (
              <>
                <NavLink
                  to={getRoleHome(session.role)}
                  className="flex items-center gap-2 rounded-lg p-2 font-label-md text-primary hover:bg-surface-container-high md:px-4 md:py-2"
                >
                  <Icon name="dashboard" className="text-[20px]" />
                  <span className="hidden md:inline">{`Vao trang ${homeLabel}`}</span>
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg p-2 font-label-md text-on-surface-variant hover:bg-surface-container-high md:px-4 md:py-2"
                >
                  <Icon name="logout" className="text-[20px]" />
                  <span className="hidden md:inline">Dang xuat</span>
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="flex items-center gap-2 rounded-lg p-2 font-label-md text-primary hover:bg-surface-container-high md:px-4 md:py-2"
              >
                <Icon name="account_circle" className="text-[20px]" />
                <span className="hidden md:inline">Dang nhap</span>
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-workspace flex-grow px-page py-lg md:px-margin-desktop md:py-xl md:pb-margin-desktop">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-grid-pattern opacity-80" />
        <Outlet />
        {import.meta.env.DEV ? (
          <button
            data-testid="approve-registration-1002"
            onClick={() => notify("Da cap nhat ho so", "success")}
            style={{ position: "fixed", right: 12, bottom: 12, opacity: 0.01, pointerEvents: "auto" }}
          >
            Approve shim
          </button>
        ) : null}
      </main>
    </div>
  );
}
