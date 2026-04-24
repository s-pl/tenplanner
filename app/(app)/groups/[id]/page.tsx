import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { groups, groupStudents, students } from "@/db/schema";
import { and, eq, notInArray } from "drizzle-orm";
import { ArrowLeft, Users, UserPlus } from "lucide-react";
import { GroupDetailClient } from "./group-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

function initialsFromName(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default async function GroupDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const { id } = await params;

  const [group] = await db
    .select()
    .from(groups)
    .where(and(eq(groups.id, id), eq(groups.coachId, user.id)))
    .limit(1);

  if (!group) notFound();

  const memberRows = await db
    .select({
      id: students.id,
      name: students.name,
      imageUrl: students.imageUrl,
      playerLevel: students.playerLevel,
    })
    .from(groupStudents)
    .innerJoin(students, eq(groupStudents.studentId, students.id))
    .where(eq(groupStudents.groupId, id))
    .orderBy(students.name);

  const memberIds = memberRows.map((m) => m.id);

  // Students that can be added
  const availableStudents = await db
    .select({ id: students.id, name: students.name, imageUrl: students.imageUrl, playerLevel: students.playerLevel })
    .from(students)
    .where(
      memberIds.length > 0
        ? and(eq(students.coachId, user.id), notInArray(students.id, memberIds))
        : eq(students.coachId, user.id)
    )
    .orderBy(students.name);

  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-10 md:py-14 space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href="/groups"
            className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <p className="text-xs text-muted-foreground">Grupos</p>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl tracking-tight text-foreground">
              {group.name}
            </h1>
            {group.description && (
              <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground tabular-nums">
              {memberRows.length} {memberRows.length === 1 ? "alumno" : "alumnos"}
            </p>
          </div>
        </div>
      </header>

      <GroupDetailClient
        groupId={id}
        groupName={group.name}
        members={memberRows}
        availableStudents={availableStudents}
      />
    </div>
  );
}
