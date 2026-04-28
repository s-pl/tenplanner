import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { exercises, sessions, sessionExercises } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { exerciseVisibleToUserCondition } from "@/lib/exercise-access";
import { SessionWizard } from "@/components/app/session-wizard/session-wizard";
import type { WizardExercise } from "@/components/app/session-wizard/types";
import { getBooleanSetting } from "@/lib/app-settings";
import { FeatureLocked } from "@/components/app/feature-locked";

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

  const [sessionCreationEnabled, publicExercisesEnabled] = await Promise.all([
    getBooleanSetting("feature.session_creation_enabled"),
    getBooleanSetting("feature.public_exercises_enabled"),
  ]);
  if (!sessionCreationEnabled) {
    return (
      <FeatureLocked
        title="Crear sesiones está bloqueado"
        description="Un administrador ha desactivado temporalmente la creación manual de sesiones."
        href="/sessions"
        cta="Volver a sesiones"
      />
    );
  }

  const allExercises = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      category: exercises.category,
      difficulty: exercises.difficulty,
      durationMinutes: exercises.durationMinutes,
    })
    .from(exercises)
    .where(
      publicExercisesEnabled
        ? exerciseVisibleToUserCondition(user.id)
        : eq(exercises.createdBy, user.id)
    )
    .orderBy(exercises.name)
    .limit(200);

  const { exercises: exerciseParam, from: fromSessionId } = await searchParams;

  // Pre-fill from an existing session ("Reutilizar")
  let fromSession: {
    title: string;
    objective: string | null;
    location: string | null;
  } | null = null;
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
    fromExercises.length > 0
      ? fromExercises
      : preSelected.length > 0
        ? preSelected
        : undefined;
  const allowDraftRestore = !fromSession && preSelected.length === 0;

  return (
    <div className="relative min-h-full">
      <div className="relative flex min-h-full flex-col px-4 py-6 sm:px-6 md:px-10 md:py-8">
        <header className="flex items-center gap-4 border-b border-foreground/15 pb-5">
          <Link
            href="/sessions"
            aria-label="Volver a sesiones"
            className="flex size-9 shrink-0 items-center justify-center border border-foreground/18 text-foreground/55 transition-colors hover:border-brand hover:text-brand"
          >
            ←
          </Link>
          <h1 className="font-heading text-2xl md:text-3xl leading-tight tracking-tight text-foreground">
            {fromSession ? (
              <>
                Reutilizando{" "}
                <em className="italic text-brand">
                  &ldquo;{fromSession.title}&rdquo;
                </em>
              </>
            ) : preSelected.length > 0 ? (
              <>
                <em className="italic text-brand">
                  {preSelected.length} ejercicio
                  {preSelected.length !== 1 ? "s" : ""}
                </em>{" "}
                de Dr. Planner
              </>
            ) : (
              <>
                Nueva <em className="italic text-brand">sesión</em>
              </>
            )}
          </h1>
        </header>

        <div className="flex w-full flex-1 flex-col gap-6 pt-8">
          <Suspense fallback={null}>
            <SessionWizard
              availableExercises={allExercises}
              initialExercises={initialExercises}
              initialTitle={fromSession?.title}
              initialObjective={fromSession?.objective ?? undefined}
              initialLocation={fromSession?.location ?? undefined}
              allowDraftRestore={allowDraftRestore}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
