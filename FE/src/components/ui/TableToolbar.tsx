import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface TableToolbarProps {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  filters?: ReactNode;
  actions?: ReactNode;
}

export function TableToolbar({
  searchValue = "",
  searchPlaceholder = "Tìm kiếm",
  onSearchChange,
  filters,
  actions
}: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-md border-b border-outline-variant bg-surface-container-low p-md lg:flex-row lg:items-center lg:justify-between">
      <label className="relative min-w-0 flex-1 lg:max-w-md">
        <span className="sr-only">{searchPlaceholder}</span>
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant" />
        <input
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          className="form-input w-full pl-10"
          placeholder={searchPlaceholder}
        />
      </label>
      <div className="flex min-w-0 flex-wrap items-center gap-sm lg:justify-end">
        {filters}
        {actions}
      </div>
    </div>
  );
}
