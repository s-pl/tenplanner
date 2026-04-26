export default function Loading() {
  return (
    <div className="px-6 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-52 rounded-xl bg-muted/30" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="h-5 w-1/3 rounded-lg bg-muted/30" />
            <div className="h-20 w-full rounded-xl bg-muted/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
