export default function ExercisesLoading() {
  return (
    <div className="px-6 md:px-8 py-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-xl bg-muted/30" />
          <div className="h-4 w-32 rounded-lg bg-muted/30" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-muted/30" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/20 rounded-xl p-1 w-fit">
        {[60, 72, 56].map((w, i) => (
          <div key={i} className="h-8 rounded-lg bg-muted/30" style={{ width: w }} />
        ))}
      </div>

      {/* Category strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-card border border-border/50" />
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 h-9 rounded-xl bg-muted/30" />
        <div className="h-9 w-48 rounded-xl bg-muted/30" />
      </div>

      {/* Cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="aspect-video w-full bg-muted/30" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-20 rounded-full bg-muted/30" />
              <div className="h-4 w-full rounded-lg bg-muted/30" />
              <div className="h-3 w-3/4 rounded-lg bg-muted/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
