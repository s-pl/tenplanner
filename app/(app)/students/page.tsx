import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { Plus, Users, Search, ChevronRight, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { students as studentsTable } from "@/db/schema";

type PlayerLevel = "beginner" | "amateur" | "intermediate" | "advanced" | "competitive";

const LEVEL_LABEL: Record<PlayerLevel, string> = {
  beginner: "Principiante",
  amateur: "Amateur",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  competitive: "Competitivo",
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

function initialsFromName(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default async function StudentsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { q } = await searchParams;

  const rows = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.coachId, user.id))
    .orderBy(asc(studentsTable.name));

  const filtered = q
    ? rows.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
    : rows;

  return (
    <div className="px-6 md:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Alumnos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {rows.length} alumno{rows.length !== 1 ? "s" : ""} registrado{rows.length !== 1 ? "s" : ""}
          </p>
        </div>
        {rows.length > 0 && (
          <Link
            href="/students/new"
            className="inline-flex items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand/90 transition-colors shrink-0"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nuevo alumno</span>
          </Link>
        )}
      </div>

      {rows.length > 0 && (
        <form className="relative" action="/students" method="get">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="search" name="q"
            placeholder="Buscar por nombre…"
            defaultValue={q}
            className="w-full sm:max-w-sm h-9 pl-9 pr-4 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 text-foreground placeholder:text-muted-foreground"
          />
        </form>
      )}

      {rows.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <div className="size-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <Users className="size-6 text-brand" />
          </div>
          <p className="font-heading text-xl font-semibold text-foreground mb-1">Todavía no tienes alumnos</p>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
            Crea tu primer alumno para empezar a planificar sus sesiones de entrenamiento.
          </p>
          <Link
            href="/students/new"
            className="inline-flex items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand/90 transition-colors"
          >
            <Plus className="size-4" />
            Crear alumno
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <p className="font-medium text-foreground mb-1">Sin resultados</p>
          <p className="text-sm text-muted-foreground">
            Ningún alumno coincide con &ldquo;{q}&rdquo;.
          </p>
          <Link href="/students"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand/80 transition-colors mt-4">
            Limpiar búsqueda
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((student) => {
            const level = student.playerLevel as PlayerLevel | null;
            return (
              <Link
                key={student.id}
                href={`/students/${student.id}`}
                className="group bg-card border border-border rounded-2xl p-5 hover:border-brand/30 transition-colors flex items-center gap-4"
              >
                <div className="size-12 rounded-full bg-brand/15 flex items-center justify-center shrink-0 overflow-hidden">
                  {student.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={student.imageUrl} alt={student.name} className="size-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-brand">{initialsFromName(student.name)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm leading-snug truncate">{student.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {level && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                        <Trophy className="size-3" />
                        {LEVEL_LABEL[level]}
                      </span>
                    )}
                    {student.email && (
                      <span className="text-xs text-muted-foreground truncate">{student.email}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-brand transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
