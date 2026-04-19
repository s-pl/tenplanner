import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { SessionWizard } from "@/components/app/session-wizard/session-wizard";
import type { WizardExercise } from "@/components/app/session-wizard/types";

interface PageProps {
  searchParams: Promise<{ exercises?: string; step?: string }>;
}

export default async function NewSessionPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    .orderBy(exercises.name);

  const { exercises: exerciseParam } = await searchParams;
  const preSelectedIds = new Set((exerciseParam ?? "").split(",").filter(Boolean));
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

  return (
    <div className="px-4 md:px-8 py-8">
      <div className="mx-auto w-full max-w-[720px] space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/sessions"
            className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Nueva sesión
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {preSelected.length > 0
                ? `${preSelected.length} ejercicio${preSelected.length !== 1 ? "s" : ""} pre-seleccionado${preSelected.length !== 1 ? "s" : ""} desde Dr. Planner`
                : "Diseña tu plan de entrenamiento"}
            </p>
          </div>
        </div>

        <Suspense fallback={null}>
          <SessionWizard
            availableExercises={allExercises}
            initialExercises={preSelected.length > 0 ? preSelected : undefined}
          />
        </Suspense>
      </div>
    </div>
  );
}
