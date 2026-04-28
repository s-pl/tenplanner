import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ExerciseForm } from "@/components/app/exercise-form";
import { FeatureLocked } from "@/components/app/feature-locked";
import { getBooleanSetting } from "@/lib/app-settings";

interface PageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function NewExercisePage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const [[dbUser], exerciseCreationEnabled] = await Promise.all([
    db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1),
    getBooleanSetting("feature.exercise_creation_enabled"),
  ]);

  if (!exerciseCreationEnabled) {
    return (
      <FeatureLocked
        title="Creación de ejercicios desactivada"
        description="El administrador ha pausado temporalmente la creación manual de ejercicios."
        href="/exercises"
        cta="Volver a ejercicios"
      />
    );
  }

  const isAdmin = !!dbUser?.isAdmin;
  const { mode } = await searchParams;
  const initialFormMode =
    mode === "full" || mode === "quick" ? mode : undefined;

  return (
    <div className="flex min-h-full flex-col gap-6 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="flex items-center gap-4">
        <Link
          href="/exercises"
          className="flex size-9 shrink-0 items-center justify-center border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Volver a ejercicios"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Nuevo ejercicio
        </h1>
      </div>

      <div className="flex-1">
        <ExerciseForm
          mode="create"
          isAdmin={isAdmin}
          initialFormMode={initialFormMode}
          enableDrafts
        />
      </div>
    </div>
  );
}
