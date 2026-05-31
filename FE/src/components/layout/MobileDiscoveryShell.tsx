import { NavLink, Outlet } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { participantMobileNav } from "../../config/navigation";

export function MobileDiscoveryShell() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="fixed top-0 w-full z-50 border-b border-outline-variant bg-surface-container-low flex justify-between items-center h-16 px-margin-mobile">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
            <Icon name="shield" filled className="text-on-primary-container text-[18px]" />
          </div>
          <h1 className="font-headline-md text-primary tracking-tight">HACKCOMMAND</h1>
        </div>
        <NavLink to="/login" className="p-2 text-primary hover:bg-surface-variant/50 rounded-lg">
          <Icon name="login" />
        </NavLink>
      </header>

      <main className="flex-grow pt-20 pb-24 px-margin-mobile">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full z-50 border-t border-outline-variant bg-surface-container-high flex justify-around items-center h-20 px-2">
        {participantMobileNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-4 py-1 rounded-full transition-all duration-200 ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant hover:text-primary"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} filled={isActive} />
                <span className="font-label-sm mt-0.5 normal-case">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
