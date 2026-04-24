export default function NewSessionLoading() {
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-10 space-y-8 animate-pulse">
      <div className="h-9 w-56 rounded-xl bg-muted/30" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-xl bg-muted/30" />
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-2xl">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 rounded bg-muted/30" />
            <div className="h-10 w-full rounded-xl bg-muted/20" />
          </div>
        ))}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/10">
              <div className="size-8 rounded-lg bg-muted/30 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-40 rounded bg-muted/30" />
                <div className="h-3 w-24 rounded bg-muted/20" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-10 w-36 rounded-xl bg-muted/30" />
      </div>
    </div>
  );
}
