"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock3,
  ClipboardList,
  Dumbbell,
  Layers3,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type LandingExerciseCard = {
  id: string;
  name: string;
  durationMinutes: number;
  nivel: string | null;
  aspectoJuego: string | null;
};

type LandingClassCard = {
  id: string;
  name: string;
  duracionMinutes: number;
  nivel: string | null;
  objetivos: string | null;
  numAlumnos: number | null;
};

type LibraryPreview = {
  href: string;
  title: string;
  top: string;
  tag: string;
  level: string;
  time: string;
  tone: string;
  icon: LucideIcon;
};

type LibraryTab = "exercises" | "classes";

const cardStyles = [
  {
    top: "bg-[#20201c]",
    tone: "text-[#d6ff38]",
    exerciseIcon: Dumbbell,
    classIcon: Layers3,
  },
  {
    top: "bg-[#2b3613]",
    tone: "text-[#d6ff38]",
    exerciseIcon: Clock3,
    classIcon: ClipboardList,
  },
  {
    top: "bg-[#3a3a34]",
    tone: "text-[#d6ff38]",
    exerciseIcon: Trophy,
    classIcon: Trophy,
  },
];

function cleanLabel(value: string | null, fallback: string) {
  if (!value) return fallback;
  return value.replace(/_/g, " ");
}

function buildExerciseCards(cards: LandingExerciseCard[]): LibraryPreview[] {
  return cards.slice(0, 3).map((card, index) => {
    const style = cardStyles[index] ?? cardStyles[0];

    return {
      href: `/exercises/${card.id}`,
      title: card.name,
      top: style.top,
      tag: cleanLabel(card.aspectoJuego, "Biblioteca"),
      level: cleanLabel(card.nivel, "Todos"),
      time: `${card.durationMinutes} min`,
      tone: style.tone,
      icon: style.exerciseIcon,
    };
  });
}

function buildClassCards(cards: LandingClassCard[]): LibraryPreview[] {
  return cards.slice(0, 3).map((card, index) => {
    const style = cardStyles[index] ?? cardStyles[0];

    return {
      href: `/classes/${card.id}`,
      title: card.name,
      top: style.top,
      tag: "Clase",
      level: cleanLabel(card.nivel, `${card.numAlumnos ?? "Grupo"} alumnos`),
      time: `${card.duracionMinutes} min`,
      tone: style.tone,
      icon: style.classIcon,
    };
  });
}

function PreviewCard({ item }: { item: LibraryPreview }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="block overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] transition hover:-translate-y-1 hover:border-white/18"
    >
      <div className={cn("grid h-[120px] place-items-center", item.top)}>
        <Icon className="size-10 text-[#d6ff38]" strokeWidth={1.7} />
      </div>
      <div className="p-4">
        <h3 className="min-h-10 text-base font-bold leading-5 text-white">
          {item.title}
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={cn(
              "rounded-full bg-white/8 px-3 py-1 text-xs font-semibold",
              item.tone
            )}
          >
            {item.tag}
          </span>
          <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/55">
            {item.level}
          </span>
          <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/55">
            {item.time}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function LibraryTabs({
  exerciseCards,
  classCards,
}: {
  exerciseCards: LandingExerciseCard[];
  classCards: LandingClassCard[];
}) {
  const [activeTab, setActiveTab] = useState<LibraryTab>("exercises");
  const exercises = buildExerciseCards(exerciseCards);
  const classes = buildClassCards(classCards);
  const activeCards = activeTab === "exercises" ? exercises : classes;
  const cta =
    activeTab === "exercises"
      ? { href: "/exercises", label: "Ver todos los ejercicios →" }
      : { href: "/classes", label: "Ver todas las clases →" };

  return (
    <>
      <div
        role="tablist"
        aria-label="Biblioteca de ejercicios y clases"
        className="mt-12 inline-flex rounded-full bg-white/8 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "exercises"}
          onClick={() => setActiveTab("exercises")}
          className={cn(
            "rounded-full px-6 py-2 text-sm transition",
            activeTab === "exercises"
              ? "bg-[#d6ff38] font-bold text-[#050505]"
              : "text-white/62 hover:text-white"
          )}
        >
          Ejercicios
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "classes"}
          onClick={() => setActiveTab("classes")}
          className={cn(
            "rounded-full px-6 py-2 text-sm transition",
            activeTab === "classes"
              ? "bg-[#d6ff38] font-bold text-[#050505]"
              : "text-white/62 hover:text-white"
          )}
        >
          Clases completas
        </button>
      </div>

      {activeCards.length > 0 ? (
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {activeCards.map((item) => (
            <PreviewCard key={item.href} item={item} />
          ))}
        </div>
      ) : (
        <div className="mt-9 rounded-xl border border-white/10 bg-white/[0.045] px-5 py-8 text-sm font-semibold text-white/55">
          Aún no hay contenido visible en esta biblioteca.
        </div>
      )}

      <div className="mt-12 flex justify-center">
        <Link
          href={cta.href}
          className="rounded-full border border-white/18 bg-white/8 px-7 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#050505]"
        >
          {cta.label}
        </Link>
      </div>
    </>
  );
}
