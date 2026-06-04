interface ModuleSkeletonProps {
  rows?: number;
  /** `cards` = lưới thẻ; `table` = bảng; `default` = danh sách chung */
  variant?: "default" | "cards" | "table";
}

export function ModuleSkeleton({ rows = 4, variant = "default" }: ModuleSkeletonProps) {
  if (variant === "cards") {
    return (
      <div className="grid animate-pulse grid-cols-1 gap-md md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: Math.min(rows, 3) }).map((_, index) => (
          <div
            key={index}
            className="min-h-[280px] rounded-xl border border-outline-variant bg-surface-container p-md"
          >
            <div className="h-4 w-24 rounded bg-surface-variant" />
            <div className="mt-md h-6 w-3/4 rounded bg-surface-variant/80" />
            <div className="mt-lg h-10 w-full rounded-lg bg-surface-variant/60" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="animate-pulse overflow-hidden rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="h-5 w-44 rounded bg-surface-variant" />
        <div className="mt-md space-y-sm">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="h-12 rounded bg-surface-variant/70" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse rounded-xl border border-outline-variant bg-surface-container p-lg">
      <div className="h-5 w-44 rounded bg-surface-variant" />
      <div className="mt-md grid gap-sm">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid gap-sm md:grid-cols-[1fr_160px_120px]">
            <div className="h-10 rounded bg-surface-variant/80" />
            <div className="h-10 rounded bg-surface-variant/70" />
            <div className="h-10 rounded bg-surface-variant/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
