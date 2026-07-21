import type { ReactNode } from "react";

interface DataTableProps {
  headers: ReactNode[];
  children: ReactNode;
  /** Cố định cột cuối (thao tác) */
  stickyActions?: boolean;
  /** Cố định cột đầu khi cuộn ngang */
  stickyFirstColumn?: boolean;
}

export const tableRowClass =
  "font-body-sm text-on-surface transition-colors even:bg-surface-container-low/50 hover:bg-surface-container-high/80";

export const tableActionCellClass = "w-[1%] whitespace-nowrap px-sm py-2";

export const tableFirstCellStickyClass =
  "sticky left-0 z-10 bg-surface-container px-sm py-2 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]";

export function DataTable({
  headers,
  children,
  stickyActions = true,
  stickyFirstColumn = false
}: DataTableProps) {
  const lastIndex = headers.length - 1;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-on-surface">
        <thead className="table-header-bg">
          <tr className="font-label-sm text-on-surface-variant">
            {headers.map((header, index) => (
              <th
                key={index}
                className={`whitespace-nowrap px-sm py-2 ${
                  stickyFirstColumn && index === 0
                    ? "sticky left-0 z-10 bg-surface-container"
                    : ""
                } ${
                  stickyActions && index === lastIndex ? "w-[1%] text-right" : ""
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table-divider">{children}</tbody>
      </table>
    </div>
  );
}
