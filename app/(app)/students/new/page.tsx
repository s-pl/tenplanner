import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentForm } from "@/components/app/student-form";

export default async function NewStudentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="px-6 md:px-8 py-8 space-y-6 max-w-4xl">
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

      <div className="bg-card border border-border rounded-2xl p-6">
        <StudentForm mode="create" />
      </div>
    </div>
  );
}
