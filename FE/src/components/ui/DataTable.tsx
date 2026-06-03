import type { ReactNode } from "react";

interface DataTableProps {
  headers: ReactNode[];
  children: ReactNode;
}

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-on-surface">
        <thead className="table-header-bg">
          <tr className="font-label-sm text-on-surface-variant">
            {headers.map((header, index) => (
              <th key={index} className="whitespace-nowrap px-md py-3">
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
