import { NavLink, Outlet, useLocation } from "react-router-dom";
import { getAuthSession, isAuthenticated, setAuthenticated } from "../../auth/authSession";
import {
  getVisibleNavItems,
  navItemUsesEnd,
  participantHubNav,
  participantWorkspaceNav
} from "../../config/navigation";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { RoleSwitcher } from "../auth/RoleSwitcher";
import { Icon } from "../ui/Icon";
import { ButtonLink } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";
import { PublicShell } from "./PublicShell";
import { ShellLayout } from "./ShellLayout";
import { sidebarNavClassName, sidebarPrimaryActionClassName } from "./sidebarStyles";

export function ParticipantShell() {
  const location = useLocation();
  const { event } = useActiveEvent();
  const isWorkspace = location.pathname.startsWith("/me");
  const navItems = isWorkspace ? participantWorkspaceNav : participantHubNav;
  const visibleNavItems = getVisibleNavItems(navItems);

  const title = isWorkspace ? "Không gian thi" : "SEAL Hackathon";
  const subtitle = isWorkspace
    ? event?.name ?? "Chọn cuộc thi từ danh sách"
    : "Chọn cuộc thi để tham gia";

  const primaryAction = isWorkspace
    ? { label: "Danh sách các cuộc thi", icon: "event", to: "/events" as const }
    : undefined;

  function handleLogout() {
    setAuthenticated(false);
    window.location.href = "/events";
  }

  const sidebar = (
    <>
      <div className="flex items-center gap-sm rounded-xl border border-outline-variant/60 bg-surface-container-low p-sm shadow-glow">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-container">
          <Icon name="shield" filled className="text-on-primary-container text-[20px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-headline-sm text-on-surface">{title}</p>
          <p className="truncate font-label-sm normal-case tracking-normal text-on-surface-variant">
            {subtitle}
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="px-sm">
        <RoleSwitcher compact />
      </div>

      {primaryAction?.to ? (
        <ButtonLink
          to={primaryAction.to}
          className={sidebarPrimaryActionClassName}
          icon={<Icon name={primaryAction.icon} className="text-[18px]" />}
        >
          {primaryAction.label}
        </ButtonLink>
      ) : null}

      <nav className="flex flex-grow flex-col gap-1 overflow-y-auto pr-1">
        {visibleNavItems.map((item, index) => {
          const showGroup = item.group && item.group !== visibleNavItems[index - 1]?.group;
          const end = navItemUsesEnd(item, location.pathname);
          const hubPrimary = !isWorkspace && item.to === "/events";
          return (
            <div key={item.to} className={showGroup && index > 0 ? "mt-sm" : undefined}>
              {showGroup ? (
                <p className="px-sm pb-1 pt-2 font-label-sm normal-case tracking-normal text-outline">
                  {item.group}
                </p>
              ) : null}
              <NavLink
                to={item.to}
                end={end}
                className={({ isActive }) =>
                  hubPrimary
                    ? `${sidebarPrimaryActionClassName} flex items-center gap-3 rounded-lg py-2.5 font-label-md`
                    : sidebarNavClassName(isActive)
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      name={item.icon}
                      filled={isActive || hubPrimary}
                      className={`text-[20px] ${isActive || hubPrimary ? "text-primary" : ""}`}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant/60 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-sm py-2 font-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        >
          <Icon name="logout" className="text-[20px]" />
          Đăng xuất
        </button>
      </div>
    </>
  );

  return (
    <ShellLayout sidebar={sidebar} drawerTitle={title}>
      <Outlet />
    </ShellLayout>
  );
}

export function ParticipantAwareShell() {
  const authenticated = isAuthenticated();
  const session = getAuthSession();
  if (authenticated && session.role === "participant") {
    return <ParticipantShell />;
  }
  return <PublicShell />;
}
