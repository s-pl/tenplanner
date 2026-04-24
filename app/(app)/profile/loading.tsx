export default function ProfileLoading() {
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-10 space-y-8 animate-pulse">
      <div className="flex items-center gap-5">
        <div className="size-20 rounded-full bg-muted/30 shrink-0" />
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-muted/30" />
          <div className="h-4 w-36 rounded bg-muted/30" />
        </div>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-xl bg-muted/30" />
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 rounded bg-muted/30" />
            <div className="h-10 w-full rounded-xl bg-muted/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
