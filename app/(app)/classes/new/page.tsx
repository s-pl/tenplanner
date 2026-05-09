import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { eq, or } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { exercises, users } from "@/db/schema";
import { ClassForm } from "@/components/app/class-form";

export default async function NewClassPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [adminRow] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const availableExercises = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      category: exercises.category,
    })
    .from(exercises)
    .where(or(eq(exercises.isGlobal, true), eq(exercises.createdBy, user.id))!)
    .orderBy(exercises.name)
    .limit(500);

  return (
    <div className="max-w-4xl space-y-6 px-4 py-8 sm:px-6 md:px-8">
      <Link
        href="/classes"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Volver a clases
      </Link>

      <div>
        <h1 className="font-heading text-3xl sm:text-4xl italic text-foreground leading-tight">
          Nueva clase
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-prose">
          Define una plantilla reutilizable. Luego podrás cargarla en cualquier
          sesión.
        </p>
      </div>

      <ClassForm
        mode="create"
        availableExercises={availableExercises}
        isAdmin={adminRow?.isAdmin ?? false}
      />
    </div>
  );
}
