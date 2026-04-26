export default function Loading() {
  return (
    <div className="px-6 md:px-8 py-8 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-xl bg-muted/30" />
        <div className="h-4 w-56 rounded-lg bg-muted/30" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="h-5 w-2/3 rounded-lg bg-muted/30" />
            <div className="h-3 w-1/2 rounded-lg bg-muted/30" />
            <div className="h-8 w-20 rounded-xl bg-muted/30 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
