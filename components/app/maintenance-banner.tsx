import { Megaphone } from "lucide-react";

export function MaintenanceBanner({ message }: { message?: string | null }) {
  const text = message?.trim();
  if (!text) return null;

  return (
    <div className="border-b border-brand/20 bg-brand/10 px-4 py-2 text-brand">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-sm font-medium">
        <Megaphone className="size-4 shrink-0" />
        <p className="min-w-0 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
