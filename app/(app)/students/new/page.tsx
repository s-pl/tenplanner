import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentForm } from "@/components/app/student-form";

export default async function NewStudentPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  return (
    <div className="max-w-4xl space-y-6 px-4 py-8 sm:px-6 md:px-8">
      <div className="flex items-center gap-4">
        <Link
          href="/students"
          className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Nuevo alumno
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registra un nuevo alumno en tu cartera
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <StudentForm mode="create" />
      </div>
    </div>
  );
}
