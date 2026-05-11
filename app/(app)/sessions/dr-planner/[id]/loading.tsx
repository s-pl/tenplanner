export default function DrPlannerChatLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[#F4F4F1] text-[#050505] dark:bg-[#050505] dark:text-white">
      <div className="flex items-center gap-3 border-b border-[#050505]/10 bg-white/86 px-4 py-4 dark:border-white/10 dark:bg-[#10100e]/86 sm:px-6">
        <div className="size-10 rounded-full bg-muted/45" />
        <div className="space-y-1">
          <div className="h-5 w-40 rounded-lg bg-muted/45" />
          <div className="h-3 w-24 rounded-lg bg-muted/35" />
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-hidden px-4 py-6 sm:px-6">
        <div className="flex justify-start">
          <div className="max-w-xs space-y-2 rounded-[24px] border border-[#050505]/10 bg-white p-4 dark:border-white/10 dark:bg-[#10100e]">
            <div className="h-3 w-48 rounded-lg bg-muted/45" />
            <div className="h-3 w-36 rounded-lg bg-muted/35" />
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-xs space-y-2 rounded-[24px] bg-brand/15 p-4">
            <div className="h-3 w-40 rounded-lg bg-muted/45" />
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-sm space-y-2 rounded-[24px] border border-[#050505]/10 bg-white p-4 dark:border-white/10 dark:bg-[#10100e]">
            <div className="h-3 w-56 rounded-lg bg-muted/45" />
            <div className="h-3 w-44 rounded-lg bg-muted/35" />
            <div className="h-3 w-32 rounded-lg bg-muted/35" />
          </div>
        </div>
      </div>
      <div className="border-t border-[#050505]/10 bg-white/86 px-4 py-4 dark:border-white/10 dark:bg-[#10100e]/86 sm:px-6">
        <div className="flex gap-3">
          <div className="h-11 flex-1 rounded-full bg-muted/35" />
          <div className="size-11 rounded-full bg-muted/45" />
        </div>
      </div>
    </div>
  );
}
