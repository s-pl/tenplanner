export default function GroupDetailLoading() {
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-10 space-y-8 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-muted/30" />
        <div className="h-4 w-16 rounded bg-muted/30" />
      </div>
      <div className="space-y-2">
        <div className="h-10 w-64 rounded-xl bg-muted/30" />
        <div className="h-4 w-32 rounded bg-muted/30" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50">
              <div className="h-5 w-36 rounded-lg bg-muted/30" />
            </div>
            <div className="divide-y divide-border/50">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3 px-5 py-3">
                  <div className="size-8 rounded-full bg-muted/30 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-32 rounded bg-muted/30" />
                    <div className="h-3 w-20 rounded bg-muted/30" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
