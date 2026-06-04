import { NavLink, Outlet, useLocation } from "react-router-dom";
import { setAuthenticated } from "../../auth/authSession";
import { Icon } from "../ui/Icon";
import { getVisibleNavItems, navItemUsesEnd, type NavItem } from "../../config/navigation";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { RoleSwitcher } from "../auth/RoleSwitcher";
import { useToast } from "../feedback/ToastProvider";
import { ButtonLink, buttonClassName } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";
import { ShellLayout } from "./ShellLayout";
import { sidebarNavClassName, sidebarPrimaryActionClassName } from "./sidebarStyles";

interface WorkspaceShellProps {
  navItems: NavItem[];
  title?: string;
  subtitle?: string;
  showActiveEventSubtitle?: boolean;
  primaryAction?: { label: string; icon: string; to?: string };
}

export function WorkspaceShell({
  navItems,
  title = "SEAL Hackathon",
  subtitle = "Quản lý cuộc thi",
  showActiveEventSubtitle = false,
  primaryAction
}: WorkspaceShellProps) {
  const { notify } = useToast();
  const location = useLocation();
  const { event } = useActiveEvent({ autoSelectFirst: showActiveEventSubtitle });
  const visibleNavItems = getVisibleNavItems(navItems);
  const resolvedSubtitle = showActiveEventSubtitle
    ? event?.name ?? "Chọn cuộc thi trong sidebar"
    : subtitle;

  const primaryButton = primaryAction?.to ? (
    <ButtonLink
      to={primaryAction.to}
      className={sidebarPrimaryActionClassName}
      icon={<Icon name={primaryAction.icon} className="text-[18px]" />}
    >
      {primaryAction.label}
    </ButtonLink>
  ) : primaryAction ? (
    <button
      type="button"
      onClick={() => {
        notify(`${primaryAction.label} sẽ khả dụng khi backend bổ sung API.`, "warning");
      }}
      className={buttonClassName({ className: "w-full" })}
    >
      <Icon name={primaryAction.icon} className="text-[18px]" />
      {primaryAction.label}
    </button>
  ) : null;

  const sidebar = (
    <>
      <div className="flex items-center gap-sm rounded-xl border border-outline-variant/60 bg-surface-container-low p-sm shadow-glow">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-container">
          <Icon name="shield" filled className="text-on-primary-container text-[20px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-headline-sm text-on-surface">{title}</p>
          <p className="truncate font-label-sm normal-case tracking-normal text-on-surface-variant">
            {resolvedSubtitle}
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="px-sm">
        <RoleSwitcher compact />
      </div>

      {primaryButton}

      <nav className="flex flex-grow flex-col gap-1 overflow-y-auto pr-1">
        {visibleNavItems.map((item, index) => {
          const showGroup = item.group && item.group !== visibleNavItems[index - 1]?.group;
          return (
            <div key={item.to} className={showGroup && index > 0 ? "mt-sm" : undefined}>
              {showGroup ? (
                <p className="px-sm pb-1 pt-2 font-label-sm normal-case tracking-normal text-outline">
                  {item.group}
                </p>
              ) : null}
              <NavLink
                to={item.to}
                end={navItemUsesEnd(item, location.pathname)}
                className={({ isActive }) => sidebarNavClassName(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      name={item.icon}
                      filled={isActive}
                      className={`text-[20px] ${isActive ? "text-primary" : ""}`}
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
          onClick={() => {
            setAuthenticated(false);
            window.location.href = "/events";
          }}
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
