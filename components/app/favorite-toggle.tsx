"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteToggleProps {
  exerciseId: string;
  initialFavorited: boolean;
  size?: "sm" | "md";
}

export function FavoriteToggle({
  exerciseId,
  initialFavorited,
  size = "sm",
}: FavoriteToggleProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    const method = favorited ? "DELETE" : "POST";
    const res = await fetch(`/api/exercises/${exerciseId}/favorite`, { method });
    if (res.ok) setFavorited(!favorited);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={favorited ? "Quitar de favoritos" : "Añadir a favoritos"}
      className={cn(
        "flex items-center justify-center rounded-full transition-all",
        size === "sm" ? "size-7" : "size-9",
        favorited
          ? "text-red-400 bg-red-400/10 hover:bg-red-400/20"
          : "text-foreground/30 bg-foreground/5 hover:text-red-400 hover:bg-red-400/10",
        loading && "opacity-50 cursor-not-allowed"
      )}
    >
      <Heart
        className={cn(size === "sm" ? "size-3.5" : "size-5", favorited && "fill-current")}
      />
    </button>
  );
}
