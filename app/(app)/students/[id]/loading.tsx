export default function StudentDetailLoading() {
  return (
    <div className="px-4 md:px-8 py-8 space-y-6 max-w-5xl animate-pulse">
      {/* Back nav */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-muted/30 shrink-0" />
          <div className="h-4 w-20 rounded-lg bg-muted/30" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-lg bg-muted/30" />
          <div className="h-9 w-20 rounded-lg bg-muted/30" />
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="bg-brand/5 px-6 py-6 border-b border-border/50 flex items-center gap-4">
          <div className="size-16 rounded-full bg-muted/30 shrink-0" />
          <div className="space-y-2">
            <div className="h-6 w-48 rounded-xl bg-muted/30" />
            <div className="h-4 w-32 rounded-lg bg-muted/30" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted/30 border border-border" />
            ))}
          </div>
        </div>
      </div>

      {/* Sessions card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <div className="h-4 w-40 rounded-lg bg-muted/30" />
        <div className="h-4 w-56 rounded-lg bg-muted/30" />
      </div>
    </div>
  );
}
