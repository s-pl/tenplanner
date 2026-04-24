export default function DrPlannerChatLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-pulse">
      <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="size-9 rounded-xl bg-muted/30" />
        <div className="space-y-1">
          <div className="h-5 w-40 rounded-lg bg-muted/30" />
          <div className="h-3 w-24 rounded bg-muted/20" />
        </div>
      </div>
      <div className="flex-1 px-4 sm:px-6 py-6 space-y-4 overflow-hidden">
        <div className="flex justify-start">
          <div className="max-w-xs bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="h-3 w-48 rounded bg-muted/30" />
            <div className="h-3 w-36 rounded bg-muted/20" />
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-xs bg-primary/10 rounded-2xl p-4 space-y-2">
            <div className="h-3 w-40 rounded bg-muted/30" />
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-sm bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="h-3 w-56 rounded bg-muted/30" />
            <div className="h-3 w-44 rounded bg-muted/20" />
            <div className="h-3 w-32 rounded bg-muted/20" />
          </div>
        </div>
      </div>
      <div className="px-4 sm:px-6 py-4 border-t border-border">
        <div className="flex gap-3">
          <div className="flex-1 h-11 rounded-xl bg-muted/20" />
          <div className="size-11 rounded-xl bg-muted/30" />
        </div>
      </div>
    </div>
  );
}
