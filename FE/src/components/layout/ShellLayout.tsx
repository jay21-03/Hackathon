import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Icon } from "../ui/Icon";

const SIDEBAR_WIDTH_PX = 264;

interface ShellLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  /** Tiêu đề trên thanh menu thu gọn (&lt; md) */
  drawerTitle?: string;
}

/** Sidebar cố định desktop; drawer trên màn hình nhỏ */
export function ShellLayout({ sidebar, children, drawerTitle = "Menu" }: ShellLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background text-on-background">
      {drawerOpen ? (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[264px] max-w-[min(264px,85vw)] flex-col gap-sm border-r border-outline-variant/60 bg-surface/95 p-md shadow-ambient backdrop-blur-xl transition-transform duration-200 ease-out md:translate-x-0 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ width: SIDEBAR_WIDTH_PX }}
      >
        {sidebar}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:pl-[264px]">
        <header className="sticky top-0 z-30 flex items-center gap-sm border-b border-outline-variant/60 bg-surface/95 px-page py-sm backdrop-blur-xl md:hidden">
          <button
            type="button"
            aria-label="Mở menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-high"
            onClick={() => setDrawerOpen(true)}
          >
            <Icon name="menu" className="text-[22px]" />
          </button>
          <p className="truncate font-label-md text-on-surface">{drawerTitle}</p>
        </header>

        <main className="min-h-0 min-w-0 flex-1">
          <div className="mx-auto min-w-0 max-w-workspace space-y-lg overflow-x-hidden p-page md:p-margin-desktop">
            <div className="pointer-events-none fixed inset-0 -z-10 bg-grid-pattern opacity-80" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
