export default function CalendarLoading() {
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-10 space-y-6 animate-pulse">
      <div className="h-12 w-56 rounded-xl bg-muted/30" />
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-8 rounded bg-muted/30" />
          <div className="h-6 w-36 rounded-lg bg-muted/30" />
          <div className="h-6 w-8 rounded bg-muted/30" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-muted/20" />
          ))}
        </div>
      </div>
    </div>
  );
}
