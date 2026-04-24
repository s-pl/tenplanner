import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { groups, groupStudents } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { Users, Plus, ArrowRight } from "lucide-react";
import { GroupCreateForm } from "./group-create-form";

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
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
    <div className="relative px-4 sm:px-6 md:px-10 lg:px-14 py-10 md:py-14 space-y-10">
      <header className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
            Alumnos · Grupos
          </p>
          <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40 tabular-nums">
            {rows.length.toString().padStart(3, "0")} grupos
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-foreground/15">
          <div>
            <h1 className="font-heading text-4xl md:text-5xl leading-[1.05] tracking-tight">
              <em className="italic text-brand">Grupos</em> de alumnos
            </h1>
            <p className="mt-3 text-[15px] text-foreground/65 leading-relaxed">
              Organiza a tus alumnos en grupos para planificar sesiones colectivas.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create form */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
            <Plus className="size-4 text-brand" /> Nuevo grupo
          </h2>
          <GroupCreateForm />
        </div>

        {/* Groups list */}
        {rows.length === 0 ? (
          <div className="flex items-center justify-center border border-dashed border-foreground/20 rounded-2xl p-10 text-center">
            <div>
              <Users className="size-8 text-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-foreground/50">Todavía no hay grupos.</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/groups/${g.id}`}
                  className="group flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4 hover:border-brand/30 hover:bg-foreground/[0.015] transition-colors"
                >
                  <div className="size-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                    <Users className="size-5 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{g.name}</p>
                    {g.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{g.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                      {g.memberCount} {Number(g.memberCount) === 1 ? "alumno" : "alumnos"}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-foreground/30 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
