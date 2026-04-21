import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { students } from "@/db/schema";
import { StudentForm } from "@/components/app/student-form";

type Gender = "male" | "female" | "other";
type DominantHand = "left" | "right";
type PlayerLevel =
  | "beginner"
  | "amateur"
  | "intermediate"
  | "advanced"
  | "competitive";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStudentPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [student] = await db
    .select()
    .from(students)
    .where(and(eq(students.id, id), eq(students.coachId, user.id)))
    .limit(1);

  if (!student) notFound();

  return (
    <div className="px-6 md:px-8 py-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link
          href={`/students/${student.id}`}
          className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Editar alumno
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{student.name}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <StudentForm
          mode="edit"
          studentId={student.id}
          initialData={{
            name: student.name,
            email: student.email,
            gender: student.gender as Gender | null,
            birthDate: student.birthDate,
            heightCm: student.heightCm,
            weightKg: student.weightKg,
            dominantHand: student.dominantHand as DominantHand | null,
            playerLevel: student.playerLevel as PlayerLevel | null,
            yearsExperience: student.yearsExperience,
            notes: student.notes,
            imageUrl: student.imageUrl,
          }}
        />
      </div>
    </div>
  );
}
