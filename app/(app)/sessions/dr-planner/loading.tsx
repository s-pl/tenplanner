export default function DrPlannerLoading() {
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-10 space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-10 w-56 rounded-xl bg-muted/30" />
        <div className="h-4 w-80 rounded bg-muted/20" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-muted/30 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-muted/30" />
              <div className="h-3 w-32 rounded bg-muted/20" />
            </div>
            <div className="h-4 w-20 rounded bg-muted/20" />
          </div>
        ))}
      </div>
      <div className="h-12 w-48 rounded-xl bg-muted/30" />
    </div>
  );
}
