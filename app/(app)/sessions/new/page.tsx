import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { SessionForm } from "@/components/app/session-form";

export default async function NewSessionPage() {
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

  return (
    <div className="px-4 md:px-8 py-8 space-y-6">
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
            Diseña tu plan de entrenamiento
          </p>
        </div>
      </div>

      <SessionForm mode="create" availableExercises={allExercises} />
    </div>
  );
}
