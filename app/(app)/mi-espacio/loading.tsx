export default function MiEspacioLoading() {
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-10 space-y-10 animate-pulse">
      <div className="pb-6 border-b border-foreground/10 space-y-3">
        <div className="h-3 w-20 rounded bg-muted/30" />
        <div className="h-12 w-64 rounded-xl bg-muted/30" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="h-4 w-4 rounded bg-muted/30" />
            <div className="h-8 w-12 rounded-lg bg-muted/30" />
            <div className="h-3 w-20 rounded bg-muted/30" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-36 rounded-lg bg-muted/30" />
            <div className="bg-card border border-border rounded-2xl p-5 h-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
