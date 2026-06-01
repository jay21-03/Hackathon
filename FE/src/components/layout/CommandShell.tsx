import { NavLink, Outlet } from "react-router-dom";
import { Icon } from "../ui/Icon";
import type { NavItem } from "../../config/navigation";

interface CommandShellProps {
  navItems: NavItem[];
  title?: string;
  subtitle?: string;
  primaryAction?: { label: string; icon: string };
}

export function CommandShell({
  navItems,
  title = "SEAL Command",
  subtitle = "Hackathon Ops",
  primaryAction
}: CommandShellProps) {
  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex flex-col fixed left-0 top-0 z-40 h-screen w-[240px] p-md gap-sm bg-surface-container border-r border-outline-variant">
        <div className="flex items-center gap-sm mb-lg px-sm">
          <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center shrink-0">
            <Icon name="shield" filled className="text-on-primary-container text-[20px]" />
          </div>
          <div>
            <p className="font-headline-sm text-primary">{title}</p>
            <p className="font-label-sm text-on-surface-variant normal-case tracking-normal">
              {subtitle}
            </p>
          </div>
        </div>

        {primaryAction && (
          <button
            type="button"
            className="w-full py-2 px-4 bg-primary-container text-on-primary-container font-label-md rounded-lg mb-lg hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
          >
            <Icon name={primaryAction.icon} className="text-[18px]" />
            {primaryAction.label}
          </button>
        )}

        <nav className="flex flex-col gap-1 flex-grow">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/me" || item.to === "/organizer/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-sm py-2 rounded-lg font-label-md transition-all duration-200 ${
                  isActive
                    ? "bg-primary-container text-on-primary-container font-bold scale-[0.98]"
                    : "text-on-surface-variant hover:bg-surface-variant"
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

        <div className="mt-auto pt-4 border-t border-outline-variant flex flex-col gap-1">
          <a
            href="#"
            className="flex items-center gap-3 px-sm py-2 text-on-surface-variant hover:bg-surface-variant rounded-lg font-label-md"
          >
            <Icon name="description" className="text-[20px]" />
            Documentation
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-sm py-2 text-on-surface-variant hover:bg-surface-variant rounded-lg font-label-md"
          >
            <Icon name="help" className="text-[20px]" />
            Support
          </a>
        </div>
      </aside>

      <main className="flex-1 w-full md:ml-[240px] pb-24 md:pb-0 min-h-screen">
        <div className="max-w-command mx-auto p-margin-mobile md:p-margin-desktop">
          <Outlet />
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2 bg-surface-container-high border-t border-outline-variant rounded-t-xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {navItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/me" || item.to === "/organizer/dashboard"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-3 py-1 rounded-full transition-all duration-150 ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container scale-95"
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
