"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Repeat } from "lucide-react";
import { SPORT_LABELS, type Sport } from "@/lib/sport-constants";

export function SportChangePill({ sport }: { sport: Sport }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function change() {
    setLoading(true);
    try {
      await fetch("/api/public/sport", { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={change}
      disabled={loading}
      className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/18 bg-white/[0.04] px-3 text-[11px] font-semibold text-white/75 transition hover:border-[#D6FF38] hover:text-[#D6FF38] disabled:opacity-50"
    >
      <Repeat className="size-3" strokeWidth={1.8} />
      {SPORT_LABELS[sport]} · cambiar
    </button>
  );
}
