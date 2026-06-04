import type { ReactNode } from "react";

/** Khung nội dung lời mời — đồng bộ với card trong không gian thí sinh */
export function InvitationPanel({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="space-y-lg rounded-xl border border-outline-variant bg-surface-container p-lg shadow-sm md:p-xl">
        {children}
      </div>
    </div>
  );
}
