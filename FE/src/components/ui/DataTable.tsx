import type { ReactNode } from "react";

interface DataTableProps {
  headers: ReactNode[];
  children: ReactNode;
  /** Cố định cột cuối (thao tác) */
  stickyActions?: boolean;
}

export const tableRowClass =
  "font-body-sm text-on-surface transition-colors even:bg-surface-container-low/50 hover:bg-surface-container-high/80";

export const tableActionCellClass = "w-[1%] whitespace-nowrap px-md py-md";

export function DataTable({ headers, children, stickyActions = true }: DataTableProps) {
  const lastIndex = headers.length - 1;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-on-surface">
        <thead className="table-header-bg">
          <tr className="font-label-sm text-on-surface-variant">
            {headers.map((header, index) => (
              <th
                key={index}
                className={`whitespace-nowrap px-md py-3 ${
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
