export default function Loading() {
  return (
    <div className="px-6 py-8 space-y-4 animate-pulse">
      <div className="h-8 w-40 rounded-xl bg-muted/30" />
      <div className="h-10 w-full rounded-xl bg-muted/30" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-muted/20 border border-border" />
        ))}
      </div>
    </div>
  );
}
