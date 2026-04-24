import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { exercises, sessions, sessionExercises } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { SessionWizard } from "@/components/app/session-wizard/session-wizard";
import type { WizardExercise } from "@/components/app/session-wizard/types";

interface PageProps {
  searchParams: Promise<{ exercises?: string; step?: string; from?: string }>;
}

export default async function NewSessionPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const allExercises = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      category: exercises.category,
      difficulty: exercises.difficulty,
      durationMinutes: exercises.durationMinutes,
    })
    .from(exercises)
    .orderBy(exercises.name)
    .limit(200);

  const { exercises: exerciseParam, from: fromSessionId } = await searchParams;

  // Pre-fill from an existing session ("Reutilizar")
  let fromSession: { title: string; objective: string | null; location: string | null } | null = null;
  let fromExercises: WizardExercise[] = [];

  if (fromSessionId) {
    const [sourceSession] = await db
      .select({
        id: sessions.id,
        title: sessions.title,
        objective: sessions.objective,
        location: sessions.location,
        userId: sessions.userId,
      })
      .from(sessions)
      .where(eq(sessions.id, fromSessionId))
      .limit(1);

    if (sourceSession && sourceSession.userId === user.id) {
      fromSession = {
        title: sourceSession.title,
        objective: sourceSession.objective,
        location: sourceSession.location,
      };

      const sourceExercises = await db
        .select({
          exerciseId: exercises.id,
          name: exercises.name,
          category: exercises.category,
          durationMinutes: sessionExercises.durationMinutes,
          defaultDuration: exercises.durationMinutes,
          notes: sessionExercises.notes,
          phase: sessionExercises.phase,
          intensity: sessionExercises.intensity,
        })
        .from(sessionExercises)
        .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
        .where(eq(sessionExercises.sessionId, fromSessionId))
        .orderBy(asc(sessionExercises.orderIndex));

      fromExercises = sourceExercises.map((e) => ({
        exerciseId: e.exerciseId,
        name: e.name,
        category: e.category,
        durationMinutes: e.durationMinutes ?? e.defaultDuration,
        overrideDuration: e.durationMinutes ?? null,
        notes: e.notes ?? "",
        phase: e.phase ?? null,
        intensity: e.intensity ?? null,
      }));
    }
  }

  const preSelectedIds = new Set(
    (exerciseParam ?? "").split(",").filter(Boolean)
  );
  const preSelected: WizardExercise[] = allExercises
    .filter((e) => preSelectedIds.has(e.id))
    .map((e) => ({
      exerciseId: e.id,
      name: e.name,
      category: e.category,
      durationMinutes: e.durationMinutes,
      overrideDuration: null,
      notes: "",
      phase: null,
      intensity: null,
    }));

  const initialExercises =
    fromExercises.length > 0 ? fromExercises : preSelected.length > 0 ? preSelected : undefined;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px calc(100%/12))",
        }}
      />
      <div className="relative px-4 sm:px-6 md:px-10 py-10">
        <header className="pb-6 border-b border-foreground/15">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <div className="flex items-baseline gap-3">
              <Link
                href="/sessions"
                className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/45 hover:text-brand transition-colors"
              >
                ← Sesiones
              </Link>
              <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/30">
                /
              </span>
              <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/50">
                Nueva · Manual
              </p>
            </div>
            <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-foreground/45">
              № — —
            </p>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl leading-[0.95] tracking-tight text-foreground">
            Diseña tu <em className="italic text-brand">próxima sesión</em>.
          </h1>
          <p className="text-[13px] text-foreground/60 mt-4 max-w-2xl">
            {fromSession
              ? `Reutilizando "${fromSession.title}" como base. Ajusta la fecha y los detalles que necesites.`
              : preSelected.length > 0
                ? `${preSelected.length} ejercicio${preSelected.length !== 1 ? "s" : ""} pre-seleccionado${preSelected.length !== 1 ? "s" : ""} desde Dr. Planner. Ajusta detalles y publica.`
                : "Construye la sesión paso a paso: contexto, ejercicios y revisión final."}
          </p>
        </header>

        <div className="pt-8 mx-auto w-full max-w-[860px]">
          <Suspense fallback={null}>
            <SessionWizard
              availableExercises={allExercises}
              initialExercises={initialExercises}
              initialTitle={fromSession?.title}
              initialObjective={fromSession?.objective ?? undefined}
              initialLocation={fromSession?.location ?? undefined}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
