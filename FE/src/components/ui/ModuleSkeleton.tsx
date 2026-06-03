interface ModuleSkeletonProps {
  rows?: number;
}

export function ModuleSkeleton({ rows = 4 }: ModuleSkeletonProps) {
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
