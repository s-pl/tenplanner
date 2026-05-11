export default function DrPlannerLoading() {
  return (
    <div className="tp-page">
      <div className="tp-page-pad animate-pulse space-y-6">
        <div className="tp-hero-panel space-y-4 p-6 sm:p-8">
          <div className="h-5 w-36 rounded-full bg-white/15" />
          <div className="h-10 w-2/3 rounded-2xl bg-white/15" />
          <div className="h-4 w-1/2 rounded-lg bg-white/12" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="tp-panel flex items-center gap-4 p-4">
              <div className="size-10 shrink-0 rounded-full bg-muted/45" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded-lg bg-muted/45" />
                <div className="h-3 w-32 rounded-lg bg-muted/35" />
              </div>
              <div className="h-4 w-20 rounded-lg bg-muted/35" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
