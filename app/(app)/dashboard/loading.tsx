export default function DashboardLoading() {
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-10 space-y-10 animate-pulse">
      <div className="h-12 w-72 rounded-xl bg-muted/30" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="h-4 w-4 rounded bg-muted/30" />
            <div className="h-8 w-16 rounded-lg bg-muted/30" />
            <div className="h-3 w-24 rounded bg-muted/30" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-40 rounded-lg bg-muted/30" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="size-10 rounded-xl bg-muted/30 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-muted/30" />
                  <div className="h-3 w-24 rounded bg-muted/30" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
