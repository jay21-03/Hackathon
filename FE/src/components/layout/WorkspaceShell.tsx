import { NavLink, Outlet } from "react-router-dom";
import { Icon } from "../ui/Icon";
import type { NavItem } from "../../config/navigation";
import { RoleSwitcher } from "../auth/RoleSwitcher";
import { useToast } from "../feedback/ToastProvider";
import { ButtonLink, buttonClassName } from "../ui/Button";

interface WorkspaceShellProps {
  navItems: NavItem[];
  title?: string;
  subtitle?: string;
  primaryAction?: { label: string; icon: string; to?: string };
}

export function WorkspaceShell({
  navItems,
  title = "SEAL Hackathon",
  subtitle = "Quan ly cuoc thi",
  primaryAction
}: WorkspaceShellProps) {
  const { notify } = useToast();
  const primaryButton = primaryAction?.to ? (
    <ButtonLink
      to={primaryAction.to}
      className="mb-lg w-full"
      icon={<Icon name={primaryAction.icon} className="text-[18px]" />}
    >
      {primaryAction.label}
    </ButtonLink>
  ) : primaryAction ? (
    <button
      type="button"
      onClick={() => {
        notify(`${primaryAction.label} da duoc ghi nhan trong phien lam viec nay.`, "success");
      }}
      className={buttonClassName({ className: "mb-lg w-full" })}
    >
      <Icon name={primaryAction.icon} className="text-[18px]" />
      {primaryAction.label}
    </button>
  ) : null;

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background text-on-background">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[264px] flex-col gap-sm border-r border-outline-variant bg-surface p-md shadow-[8px_0_24px_rgba(15,23,42,0.04)]">
        <div className="mb-lg flex items-center gap-sm rounded-xl border border-outline-variant bg-surface-container-low p-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-container">
            <Icon name="shield" filled className="text-on-primary-container text-[20px]" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-headline-sm text-on-surface">{title}</p>
            <p className="truncate font-label-sm normal-case tracking-normal text-on-surface-variant">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="mb-md px-sm">
          <RoleSwitcher compact />
        </div>

        {primaryButton}

        <nav className="flex flex-grow flex-col gap-1 overflow-y-auto pr-1">
          {navItems.map((item, index) => {
            const showGroup = item.group && item.group !== navItems[index - 1]?.group;
            return (
              <div key={item.to} className={showGroup && index > 0 ? "mt-sm" : undefined}>
                {showGroup ? (
                  <p className="px-sm pb-1 pt-2 font-label-sm normal-case tracking-normal text-outline">
                    {item.group}
                  </p>
                ) : null}
                <NavLink
                  to={item.to}
                  end={item.to === "/me" || item.to === "/organizer/dashboard"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-sm py-2.5 font-label-md transition-colors ${
                      isActive
                        ? "bg-primary-container text-on-primary-container shadow-sm"
                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon name={item.icon} filled={isActive} className="text-[20px]" />
                      {item.label}
                    </>
                  )}
                </NavLink>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant pt-4">
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-sm py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-label-md"
          >
            <Icon name="description" className="text-[20px]" />
            Tai lieu
          </a>
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-sm py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-label-md"
          >
            <Icon name="help" className="text-[20px]" />
            Ho tro
          </a>
        </div>
      </aside>

      <main className="ml-[264px] min-h-screen w-full min-w-0 flex-1 overflow-x-hidden">
        <div className="mx-auto min-w-0 max-w-workspace overflow-x-hidden p-page md:p-margin-desktop">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
