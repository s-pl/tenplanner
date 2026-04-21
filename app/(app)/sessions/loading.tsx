export default function SessionsLoading() {
  return (
    <div className="px-6 md:px-8 py-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-xl bg-muted/30" />
          <div className="h-4 w-36 rounded-lg bg-muted/30" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-muted/30" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-muted/20 rounded-xl p-1 w-fit">
        {[52, 72, 68].map((w, i) => (
          <div
            key={i}
            className="h-8 rounded-lg bg-muted/30"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Session rows */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="size-5 rounded-full bg-muted/30 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between gap-2">
                  <div className="h-4 w-48 rounded-lg bg-muted/30" />
                  <div className="h-5 w-20 rounded-full bg-muted/30" />
                </div>
                <div className="flex gap-4">
                  <div className="h-3 w-32 rounded-lg bg-muted/30" />
                  <div className="h-3 w-16 rounded-lg bg-muted/30" />
                  <div className="h-3 w-20 rounded-lg bg-muted/30" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
