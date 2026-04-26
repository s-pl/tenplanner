"use client";

import { useState } from "react";
import { Heart, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ExerciseListPicker } from "./exercise-list-picker";

interface FavoriteToggleProps {
  exerciseId: string;
  initialFavorited: boolean;
  exerciseName?: string;
  size?: "sm" | "md";
  locked?: boolean;
}

export function FavoriteToggle({
  exerciseId,
  initialFavorited,
  exerciseName,
  size = "sm",
  locked = false,
}: FavoriteToggleProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [open, setOpen] = useState(false);

  if (locked) {
    return (
      <Link
        href="/login"
        onClick={(e) => e.stopPropagation()}
        aria-label="Inicia sesión para guardar en favoritos"
        className={cn(
          "flex items-center justify-center rounded-full transition-all text-foreground/25 bg-foreground/5 hover:text-foreground/50 hover:bg-foreground/10",
          size === "sm" ? "size-7" : "size-9"
        )}
      >
        <Lock className={cn(size === "sm" ? "size-3" : "size-4")} strokeWidth={1.8} />
      </Link>
    );
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }

  return (
    <>
      <button
        onClick={handleClick}
        aria-label={favorited ? "Gestionar listas" : "Añadir a una lista"}
        className={cn(
          "flex items-center justify-center rounded-full transition-all",
          size === "sm" ? "size-7" : "size-9",
          favorited
            ? "text-red-400 bg-red-400/10 hover:bg-red-400/20"
            : "text-foreground/30 bg-foreground/5 hover:text-red-400 hover:bg-red-400/10"
        )}
      >
        <Heart
          className={cn(size === "sm" ? "size-3.5" : "size-5", favorited && "fill-current")}
        />
      </button>

      {open && (
        <ExerciseListPicker
          exerciseId={exerciseId}
          exerciseName={exerciseName}
          onClose={() => setOpen(false)}
          onFavoritedChange={(fav) => setFavorited(fav)}
        />
      )}
    </>
  );
}
