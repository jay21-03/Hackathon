import type { AcademicTerm } from "../../types/entities";

interface AcademicTermSelectorProps {
  terms: AcademicTerm[];
  termId: number | null;
  onChange: (termId: number) => void;
  className?: string;
  label?: string;
}

export function AcademicTermSelector({
  terms,
  termId,
  onChange,
  className = "",
  label = "Học kỳ"
}: AcademicTermSelectorProps) {
  if (terms.length <= 1) {
    return null;
  }

  return (
    <label className={`flex items-center gap-2 ${className}`}>
      <span className="font-label-sm normal-case text-on-surface-variant">{label}</span>
      <select
        value={termId ?? ""}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-label-md text-on-surface focus:border-primary focus:outline-none"
      >
        {terms.map((item) => (
          <option key={item.id} value={item.id}>
            {item.code}
          </option>
        ))}
      </select>
    </label>
  );
}
