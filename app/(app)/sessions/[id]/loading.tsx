export default function SessionDetailLoading() {
  return (
    <div className="px-4 md:px-8 py-8 space-y-6 max-w-5xl animate-pulse">
      {/* Back + title row */}
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-muted/30 shrink-0" />
        <div className="h-4 w-24 rounded-lg bg-muted/30" />
      </div>

      {/* Hero card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border/50 space-y-3">
          <div className="h-7 w-64 rounded-xl bg-muted/30" />
          <div className="flex gap-3">
            <div className="h-5 w-24 rounded-full bg-muted/30" />
            <div className="h-5 w-20 rounded-full bg-muted/30" />
          </div>
        </div>
        <div className="p-6 grid sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted/30" />
          ))}
        </div>
      </div>

      {/* Analytics skeleton */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="h-5 w-32 rounded-lg bg-muted/30" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/30" />
          ))}
        </div>
      </div>

      {/* Exercises list skeleton */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <div className="h-5 w-40 rounded-lg bg-muted/30" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
