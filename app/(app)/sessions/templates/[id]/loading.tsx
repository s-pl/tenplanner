export default function Loading() {
  return (
    <div className="tp-page">
      <div className="tp-page-pad animate-pulse space-y-6">
      <div className="h-10 w-36 rounded-full bg-muted/45" />
      <div className="tp-hero-panel space-y-4 p-6 sm:p-8">
        <div className="h-5 w-24 rounded-full bg-white/15" />
        <div className="h-10 w-2/3 rounded-2xl bg-white/15" />
        <div className="h-4 w-1/2 rounded-lg bg-white/12" />
      </div>
      <div className="tp-panel space-y-3 p-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-[22px] border border-[#050505]/10 bg-[#F4F4F1] p-4 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div className="size-10 shrink-0 rounded-full bg-muted/45" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded-lg bg-muted/45" />
              <div className="h-3 w-1/3 rounded-lg bg-muted/45" />
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
