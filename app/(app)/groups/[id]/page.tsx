import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { groups, groupStudents, students } from "@/db/schema";
import { and, eq, notInArray } from "drizzle-orm";
import { ArrowLeft, Users } from "lucide-react";
import { GroupDetailClient } from "./group-detail-client";
import { FeatureLocked } from "@/components/app/feature-locked";
import { getBooleanSetting } from "@/lib/app-settings";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const groupsEnabled = await getBooleanSetting("feature.groups_enabled");
  if (!groupsEnabled) {
    return (
      <FeatureLocked
        title="Grupos desactivados"
        description="El administrador ha pausado temporalmente la organización por grupos."
        href="/students"
        cta="Volver a alumnos"
      />
    );
  }

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
    <div className="tp-page">
      <div className="tp-page-pad space-y-6">
      {/* Header */}
      <header className="tp-hero-panel p-6 text-white sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/groups"
            className="flex size-10 items-center justify-center rounded-full border border-white/12 bg-white/8 text-white/70 transition-colors hover:bg-white/12 hover:text-white"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <p className="text-xs font-black uppercase text-white/45">Grupos</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#D6FF38] text-[#050505]">
                <Users className="size-5" />
              </div>
              <h1 className="min-w-0 break-words text-4xl font-black leading-tight text-white md:text-5xl">
                {group.name}
              </h1>
            </div>
            {group.description && (
              <p className="ml-[60px] mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/62">
                {group.description}
              </p>
            )}
            <p className="ml-[60px] mt-2 text-xs font-semibold tabular-nums text-white/50">
              <span className="font-black text-[#D6FF38]">
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
    </div>
  );
}
