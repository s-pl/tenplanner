import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { groups, groupStudents, students } from "@/db/schema";
import { and, eq, notInArray } from "drizzle-orm";
import { ArrowLeft, Users } from "lucide-react";
import { GroupDetailClient } from "./group-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const availableStudents = await db
    .select({
      id: students.id,
      name: students.name,
      imageUrl: students.imageUrl,
      playerLevel: students.playerLevel,
    })
    .from(students)
    .where(
      memberIds.length > 0
        ? and(eq(students.coachId, user.id), notInArray(students.id, memberIds))
        : eq(students.coachId, user.id)
    )
    .orderBy(students.name);

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-10 lg:px-14 py-10 md:py-14">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/groups"
            className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted hover:border-foreground/20 transition-colors text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <p className="text-xs text-muted-foreground">Grupos</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="size-10 rounded-xl bg-brand/10 border border-brand/15 flex items-center justify-center shrink-0">
                <Users className="size-5 text-brand" />
              </div>
              <h1 className="min-w-0 break-words font-heading text-3xl tracking-tight text-foreground md:text-4xl">
                {group.name}
              </h1>
            </div>
            {group.description && (
              <p className="mt-2 text-sm text-muted-foreground ml-[52px]">
                {group.description}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground ml-[52px] tabular-nums">
              <span className="font-bold text-foreground">
                {memberRows.length}
              </span>{" "}
              {memberRows.length === 1 ? "alumno" : "alumnos"}
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
