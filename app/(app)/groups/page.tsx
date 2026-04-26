import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { groups, groupStudents } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { Users, ChevronRight, Shield } from "lucide-react";
import { GroupCreateForm } from "./group-create-form";

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      createdAt: groups.createdAt,
      memberCount: count(groupStudents.id),
    })
    .from(groups)
    .leftJoin(groupStudents, eq(groupStudents.groupId, groups.id))
    .where(eq(groups.coachId, user.id))
    .groupBy(groups.id)
    .orderBy(groups.name)
    .catch(() => [] as { id: string; name: string; description: string | null; createdAt: Date; memberCount: number }[]);

  return (
    <div className="relative min-h-screen px-4 sm:px-6 md:px-10 lg:px-14 py-10 md:py-14">
      {/* Page header */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40">
            Alumnos · Grupos
          </p>
          <span className="text-foreground/20">·</span>
          <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40 tabular-nums">
            {rows.length} {rows.length === 1 ? "grupo" : "grupos"}
          </p>
        </div>
        <h1 className="font-heading text-4xl md:text-5xl leading-[1.05] tracking-tight">
          <em className="italic text-brand">Grupos</em> de alumnos
        </h1>
        <p className="mt-3 text-[15px] text-foreground/55 leading-relaxed max-w-xl">
          Organiza a tus alumnos en grupos para planificar sesiones colectivas.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Groups grid */}
        <div>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-foreground/15 rounded-2xl py-20 text-center gap-4">
              <div className="size-16 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center">
                <Shield className="size-7 text-foreground/20" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground/50">Sin grupos todavía</p>
                <p className="text-sm text-foreground/35 mt-1">Crea tu primer grupo para empezar.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {rows.map((g, i) => (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="group relative flex flex-col gap-4 bg-card border border-border rounded-2xl p-5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5 transition-all duration-200"
                >
                  {/* Index badge */}
                  <span className="absolute top-4 right-4 font-mono text-[10px] text-foreground/20 tabular-nums">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>

                  {/* Icon + count */}
                  <div className="flex items-start justify-between">
                    <div className="size-11 rounded-xl bg-brand/10 border border-brand/15 flex items-center justify-center">
                      <Users className="size-5 text-brand" />
                    </div>
                    <div className="flex items-center gap-1.5 bg-foreground/5 rounded-full px-2.5 py-1 mt-0.5">
                      <span className="text-[11px] font-bold tabular-nums text-foreground/60">
                        {g.memberCount}
                      </span>
                      <span className="text-[10px] text-foreground/35">
                        {Number(g.memberCount) === 1 ? "alumno" : "alumnos"}
                      </span>
                    </div>
                  </div>

                  {/* Name + description */}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-[17px] leading-tight text-foreground group-hover:text-brand transition-colors">
                      {g.name}
                    </p>
                    {g.description ? (
                      <p className="text-[12px] text-foreground/45 mt-1.5 line-clamp-2 leading-relaxed">
                        {g.description}
                      </p>
                    ) : (
                      <p className="text-[12px] text-foreground/25 mt-1.5 italic">Sin descripción</p>
                    )}
                  </div>

                  {/* CTA arrow */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span className="text-[11px] font-medium text-foreground/40 uppercase tracking-wide">
                      Ver grupo
                    </span>
                    <ChevronRight className="size-4 text-foreground/25 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Create form sidebar */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
              <div className="size-7 rounded-lg bg-brand/10 border border-brand/15 flex items-center justify-center">
                <Shield className="size-3.5 text-brand" />
              </div>
              <h2 className="font-bold text-[13px] text-foreground uppercase tracking-wide">
                Nuevo grupo
              </h2>
            </div>
            <div className="p-5">
              <GroupCreateForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
