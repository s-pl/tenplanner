export default function Loading() {
  return (
    <div className="px-6 md:px-8 py-8 max-w-3xl space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded-xl bg-muted/30" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded-lg bg-muted/30" />
        <div className="h-4 w-5/6 rounded-lg bg-muted/30" />
        <div className="h-4 w-3/4 rounded-lg bg-muted/30" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-muted/30 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded-lg bg-muted/30" />
              <div className="h-3 w-1/3 rounded-lg bg-muted/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
