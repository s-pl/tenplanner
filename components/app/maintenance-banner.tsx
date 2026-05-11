import { Megaphone } from "lucide-react";

export function MaintenanceBanner({ message }: { message?: string | null }) {
  const text = message?.trim();
  if (!text) return null;

  return (
    <div
      role="status"
      className="relative z-20 border-b border-[#D6FF38]/30 bg-[#050505] px-4 py-2 text-white"
    >
      <div className="mx-auto flex w-full max-w-none items-center justify-center gap-2 text-sm font-bold">
        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#D6FF38] text-[#050505]">
          <Megaphone className="size-3.5" strokeWidth={2} />
        </span>
        <p className="min-w-0 leading-relaxed text-white/86">{text}</p>
      </div>
    </div>
  );
}
