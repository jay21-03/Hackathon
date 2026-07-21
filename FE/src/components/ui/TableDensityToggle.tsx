/* eslint-disable react-refresh/only-export-components */
export type TableDensity = "comfortable" | "compact";

interface TableDensityToggleProps {
  value: TableDensity;
  onChange: (value: TableDensity) => void;
}

export function getDensityCellClass(value: TableDensity) {
  return value === "compact" ? "px-2 py-1.5" : "px-sm py-2";
}

export function TableDensityToggle({ value, onChange }: TableDensityToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-outline-variant bg-surface-container-low p-1">
      {(["comfortable", "compact"] as TableDensity[]).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`rounded-md px-3 py-1.5 font-label-sm normal-case ${
            value === item
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-variant"
          }`}
        >
          {item === "comfortable" ? "Rong" : "Gon"}
        </button>
      ))}
    </div>
  );
}
