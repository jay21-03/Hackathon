import { NavLink, Outlet } from "react-router-dom";
import { Icon } from "../ui/Icon";
import type { NavItem } from "../../config/navigation";
import { RoleSwitcher } from "../auth/RoleSwitcher";
import { ConfirmAction } from "../feedback/ConfirmAction";
import { useToast } from "../feedback/ToastProvider";

interface WorkspaceShellProps {
  navItems: NavItem[];
  title?: string;
  subtitle?: string;
  primaryAction?: { label: string; icon: string };
}

export function WorkspaceShell({
  navItems,
  title = "SEAL Hackathon",
  subtitle = "Quan ly cuoc thi",
  primaryAction
}: WorkspaceShellProps) {
  const { notify } = useToast();
  const needsConfirm = Boolean(primaryAction?.label.includes("Cong bo"));
  const primaryButton = primaryAction ? (
    <button
      type="button"
      onClick={() => {
        if (!needsConfirm) {
          notify(`${primaryAction.label} da duoc ghi nhan trong phien lam viec nay.`, "success");
        }
      }}
      className="mb-lg flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2.5 font-label-md text-on-primary-container shadow-sm transition-colors hover:bg-primary"
    >
      <Icon name={primaryAction.icon} className="text-[18px]" />
      {primaryAction.label}
    </button>
  ) : null;

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background text-on-background">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[264px] flex-col gap-sm border-r border-outline-variant bg-surface p-md shadow-[8px_0_24px_rgba(15,23,42,0.04)] md:flex">
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

        {needsConfirm && primaryAction ? (
          <ConfirmAction
            title="Xac nhan thao tac"
            message="Thao tac cong bo anh huong den man hinh ket qua cua thi sinh va cong khai. Hay kiem tra ranking truoc khi tiep tuc."
            confirmLabel={primaryAction.label}
            onConfirm={() => notify(`${primaryAction.label} thanh cong trong phien lam viec nay.`, "success")}
          >
            {primaryButton}
          </ConfirmAction>
        ) : (
          primaryButton
        )}

        <nav className="flex flex-grow flex-col gap-1 overflow-y-auto pr-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
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
          ))}
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

      <main className="min-h-screen w-full min-w-0 flex-1 overflow-x-hidden pb-24 md:ml-[264px] md:pb-0">
        <div className="mx-auto min-w-0 max-w-workspace overflow-x-hidden p-margin-mobile md:p-margin-desktop">
          <nav className="md:hidden mb-md flex max-w-full gap-2 overflow-x-auto no-scrollbar border-b border-outline-variant pb-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/me" || item.to === "/organizer/dashboard"}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 font-label-sm normal-case ${
                    isActive
                      ? "bg-primary-container text-on-primary-container shadow-sm"
                      : "bg-surface-container text-on-surface-variant"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon name={item.icon} filled={isActive} className="text-[18px]" />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-outline-variant bg-surface px-2 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden">
        {navItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/me" || item.to === "/organizer/dashboard"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center rounded-lg px-3 py-1 transition-colors ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} filled={isActive} className="text-[24px]" />
                <span className="font-label-sm mt-1 normal-case">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
