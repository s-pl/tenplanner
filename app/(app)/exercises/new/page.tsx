import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ExerciseForm } from "@/components/app/exercise-form";

export default async function NewExercisePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [dbUser] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const isAdmin = !!dbUser?.isAdmin;

  return (
    <div className="px-6 md:px-8 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/exercises"
          className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Nuevo ejercicio
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Añade un ejercicio a la biblioteca
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <ExerciseForm mode="create" isAdmin={isAdmin} />
      </div>
    </div>
  );
}
