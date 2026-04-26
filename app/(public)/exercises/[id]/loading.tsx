export default function ExerciseDetailLoading() {
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-10 space-y-8 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-muted/30" />
        <div className="h-4 w-20 rounded bg-muted/30" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="h-10 w-72 rounded-xl bg-muted/30" />
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-muted/30" />
              <div className="h-6 w-20 rounded-full bg-muted/20" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="h-5 w-32 rounded-lg bg-muted/30" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="size-6 rounded-full bg-muted/30 shrink-0 mt-0.5" />
                <div className="h-4 w-full rounded bg-muted/20" />
              </div>
            ))}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <div className="h-5 w-24 rounded-lg bg-muted/30" />
            <div className="h-4 w-full rounded bg-muted/20" />
            <div className="h-4 w-4/5 rounded bg-muted/20" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 rounded bg-muted/30" />
                <div className="h-4 w-16 rounded bg-muted/20" />
              </div>
            ))}
          </div>
          <div className="h-48 rounded-2xl bg-muted/20" />
        </div>
      </div>
    </div>
  );
}
