export default function ExecuteSessionLoading() {
  return (
    <div className="min-h-screen flex flex-col px-4 py-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="size-9 rounded-xl bg-muted/30" />
        <div className="h-4 w-32 rounded bg-muted/30" />
        <div className="h-4 w-16 rounded bg-muted/30" />
      </div>
      <div className="flex justify-center gap-2 py-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="size-2.5 rounded-full bg-muted/30" />
        ))}
      </div>
      <div className="flex-1 bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-xl bg-muted/30" />
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-muted/20" />
            <div className="h-5 w-20 rounded-full bg-muted/20" />
          </div>
        </div>
        <div className="flex justify-center py-4">
          <div className="size-24 rounded-full bg-muted/20" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="size-5 rounded-full bg-muted/30 shrink-0 mt-0.5" />
              <div className="h-4 w-full rounded bg-muted/20" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <div className="h-12 w-1/3 rounded-xl bg-muted/30" />
        <div className="h-12 flex-1 rounded-xl bg-muted/30" />
      </div>
    </div>
  );
}
