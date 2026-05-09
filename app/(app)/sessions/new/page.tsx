import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  exercises,
  sessions,
  sessionExercises,
  classes,
  classBlocks,
  classBlockExercises,
  places,
  users,
} from "@/db/schema";
import { eq, asc, or } from "drizzle-orm";
import { exerciseVisibleToUserCondition } from "@/lib/exercise-access";
import { SessionWizard } from "@/components/app/session-wizard/session-wizard";
import type { WizardExercise } from "@/components/app/session-wizard/types";
import { getBooleanSetting } from "@/lib/app-settings";
import { FeatureLocked } from "@/components/app/feature-locked";

interface PageProps {
  searchParams: Promise<{
    exercises?: string;
    step?: string;
    from?: string;
    fromClass?: string;
  }>;
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

  const [coachPlaces, userRow] = await Promise.all([
    db
      .select({ id: places.id, name: places.name })
      .from(places)
      .where(eq(places.coachId, user.id))
      .orderBy(places.name),
    db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1),
  ]);
  const monitorName =
    userRow[0]?.name ||
    user.user_metadata?.full_name ||
    user.email ||
    "Monitor";

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

  const {
    exercises: exerciseParam,
    from: fromSessionId,
    fromClass: fromClassId,
  } = await searchParams;

  // Pre-fill from a class library template
  let fromClass: { name: string; objetivos: string | null } | null = null;
  let fromClassExercises: WizardExercise[] = [];

  if (fromClassId) {
    const [cls] = await db
      .select({
        id: classes.id,
        name: classes.name,
        objetivos: classes.objetivos,
        isLibrary: classes.isLibrary,
        createdBy: classes.createdBy,
      })
      .from(classes)
      .where(eq(classes.id, fromClassId))
      .limit(1);

    if (cls && (cls.isLibrary || cls.createdBy === user.id)) {
      fromClass = { name: cls.name, objetivos: cls.objetivos };
      const items = await db
        .select({
          exerciseId: exercises.id,
          name: exercises.name,
          category: exercises.category,
          defaultDuration: exercises.durationMinutes,
          itemDuration: classBlockExercises.durationMinutes,
          orderIndex: classBlockExercises.orderIndex,
          blockOrder: classBlocks.orderIndex,
        })
        .from(classBlockExercises)
        .innerJoin(
          classBlocks,
          eq(classBlocks.id, classBlockExercises.blockId)
        )
        .innerJoin(
          exercises,
          eq(exercises.id, classBlockExercises.exerciseId)
        )
        .where(eq(classBlocks.classId, fromClassId))
        .orderBy(asc(classBlocks.orderIndex), asc(classBlockExercises.orderIndex));
      fromClassExercises = items.map((e) => ({
        exerciseId: e.exerciseId,
        name: e.name,
        category: e.category,
        durationMinutes: e.itemDuration ?? e.defaultDuration,
        overrideDuration: e.itemDuration ?? null,
        notes: "",
        phase: null,
        intensity: null,
      }));
    }
  }

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
      : fromClassExercises.length > 0
        ? fromClassExercises
        : preSelected.length > 0
          ? preSelected
          : undefined;
  const allowDraftRestore =
    !fromSession && !fromClass && preSelected.length === 0;
  const noPreload =
    !fromSession && !fromClass && preSelected.length === 0;

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
            ) : fromClass ? (
              <>
                Desde clase{" "}
                <em className="italic text-brand">
                  &ldquo;{fromClass.name}&rdquo;
                </em>
              </>
            ) : preSelected.length > 0 ? (
              <>
                <em className="italic text-brand">
                  {preSelected.length} ejercicio
                  {preSelected.length !== 1 ? "s" : ""}
                </em>{" "}
                cargados
              </>
            ) : (
              <>
                Nueva <em className="italic text-brand">sesión</em>
              </>
            )}
          </h1>
        </header>

        {noPreload && (
          <div className="grid sm:grid-cols-3 gap-3 pt-6">
            <Link
              href="/classes"
              className="group rounded-2xl border border-foreground/15 bg-card hover:border-brand/50 hover:bg-brand/5 transition-colors p-5"
            >
              <div className="size-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-3">
                <span className="text-lg">📖</span>
              </div>
              <p className="font-heading text-base text-foreground group-hover:text-brand">
                Elegir del catálogo Ten Planner
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Importa una clase ya preparada y conviértela en sesión.
              </p>
            </Link>

            <Link
              href="/sessions?filter=past"
              className="group rounded-2xl border border-foreground/15 bg-card hover:border-brand/50 hover:bg-brand/5 transition-colors p-5"
            >
              <div className="size-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-3">
                <span className="text-lg">🔄</span>
              </div>
              <p className="font-heading text-base text-foreground group-hover:text-brand">
                Reutilizar clase pasada
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Copia una sesión que ya impartiste.
              </p>
            </Link>

            <div className="rounded-2xl border-2 border-brand/40 bg-brand/5 p-5">
              <div className="size-10 rounded-xl bg-brand text-brand-foreground flex items-center justify-center mb-3">
                <span className="text-lg">✏️</span>
              </div>
              <p className="font-heading text-base text-brand">
                Crear desde cero
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sigue construyendo bloque a bloque abajo.
              </p>
            </div>
          </div>
        )}

        <div className="flex w-full flex-1 flex-col gap-6 pt-8">
          <Suspense fallback={null}>
            <SessionWizard
              availableExercises={allExercises}
              initialExercises={initialExercises}
              initialTitle={fromSession?.title ?? fromClass?.name}
              initialObjective={
                fromSession?.objective ?? fromClass?.objetivos ?? undefined
              }
              initialLocation={fromSession?.location ?? undefined}
              places={coachPlaces}
              monitorName={monitorName}
              allowDraftRestore={allowDraftRestore}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
