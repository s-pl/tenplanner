export default function ResourcesLoading() {
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-10 space-y-6 animate-pulse">
      <div className="h-32 w-full rounded-2xl bg-muted/30" />
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="h-9 w-56 rounded-full bg-muted/30" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/20" />
          ))}
        </div>
      </div>
    </div>
  );
}
