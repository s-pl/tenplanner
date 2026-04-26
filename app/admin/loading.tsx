export default function Loading() {
  return (
    <div className="px-6 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-muted/30" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-2">
            <div className="h-4 w-3/4 rounded-lg bg-muted/30" />
            <div className="h-7 w-1/2 rounded-lg bg-muted/30" />
          </div>
        ))}
      </div>
    </div>
  );
}
