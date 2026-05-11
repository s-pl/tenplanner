import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen, Clock3, LibraryBig } from "lucide-react";

type ExerciseCard = {
  id: string;
  name: string;
  durationMinutes: number;
  nivel: string | null;
  aspectoJuego: string | null;
};

type ClassCard = {
  id: string;
  name: string;
  duracionMinutes: number;
  nivel: string | null;
  objetivos: string | null;
  numAlumnos: number | null;
};

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground">
      {children}
    </span>
  );
}

export function LibraryPreviewSection({
  exerciseCards,
  classCards,
}: {
  exerciseCards: ExerciseCard[];
  classCards: ClassCard[];
}) {
  return (
    <section
      id="biblioteca"
      className="border-y border-border bg-muted/25 px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
              Biblioteca publica
            </p>
            <h2 className="mt-3 max-w-2xl font-heading text-4xl font-semibold leading-tight text-foreground">
              Ejercicios y clases para deportes de raqueta.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/exercises"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground hover:border-brand/50 hover:text-brand"
            >
              Ejercicios <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/classes"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
            >
              Clases <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <LibraryBig className="size-4 text-brand" />
              Ejercicios recientes
            </div>
            <div className="grid gap-3">
              {exerciseCards.map((item) => (
                <Link
                  key={item.id}
                  href={`/exercises/${item.id}`}
                  className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      {item.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="size-3" />
                      {item.durationMinutes} min
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.nivel && <Pill>{item.nivel}</Pill>}
                    {item.aspectoJuego && <Pill>{item.aspectoJuego}</Pill>}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <BookOpen className="size-4 text-brand" />
              Clases recientes
            </div>
            <div className="grid gap-3">
              {classCards.map((item) => (
                <Link
                  key={item.id}
                  href={`/classes/${item.id}`}
                  className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      {item.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="size-3" />
                      {item.duracionMinutes} min
                    </span>
                  </div>
                  {item.objetivos && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {item.objetivos}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.nivel && <Pill>{item.nivel}</Pill>}
                    {item.numAlumnos && <Pill>{item.numAlumnos} alumnos</Pill>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
