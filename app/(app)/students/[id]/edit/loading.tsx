export default function EditStudentLoading() {
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-10 space-y-8 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-muted/30" />
        <div className="h-4 w-20 rounded bg-muted/30" />
      </div>
      <div className="h-9 w-48 rounded-xl bg-muted/30" />
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-2xl">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 rounded bg-muted/30" />
            <div className="h-10 w-full rounded-xl bg-muted/20" />
          </div>
        ))}
        <div className="flex gap-3">
          <div className="h-10 w-28 rounded-xl bg-muted/30" />
          <div className="h-10 w-20 rounded-xl bg-muted/20" />
        </div>
      </div>
    </div>
  );
}
