export default function StudentsLoading() {
  return (
    <div className="px-6 md:px-8 py-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-36 rounded-xl bg-muted/30" />
          <div className="h-4 w-44 rounded-lg bg-muted/30" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-muted/30" />
      </div>

      {/* Search bar */}
      <div className="h-9 w-full sm:max-w-sm rounded-xl bg-muted/30" />

      {/* Student cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="size-12 rounded-full bg-muted/30 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded-lg bg-muted/30" />
              <div className="h-3 w-20 rounded-full bg-muted/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
