import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { groups, groupStudents, students } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  studentIds: z.array(z.string().uuid()).optional(),
});

export async function GET(_req: Request, ctx: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const [group] = await db.select().from(groups)
    .where(and(eq(groups.id, id), eq(groups.coachId, user.id))).limit(1);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const memberRows = await db
    .select({ id: students.id, name: students.name, imageUrl: students.imageUrl, playerLevel: students.playerLevel })
    .from(groupStudents)
    .innerJoin(students, eq(groupStudents.studentId, students.id))
    .where(eq(groupStudents.groupId, id))
    .orderBy(students.name);

  return NextResponse.json({ data: { ...group, students: memberRows } });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const [existing] = await db.select({ coachId: groups.coachId }).from(groups)
    .where(eq(groups.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.coachId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { studentIds, ...fields } = parsed.data;

  await db.transaction(async (tx) => {
    if (fields.name !== undefined || fields.description !== undefined) {
      await tx.update(groups).set({
        ...(fields.name !== undefined ? { name: fields.name } : {}),
        ...(fields.description !== undefined ? { description: fields.description } : {}),
      }).where(eq(groups.id, id));
    }

    if (studentIds !== undefined) {
      // Verify all students belong to coach
      if (studentIds.length > 0) {
        const owned = await tx.select({ id: students.id }).from(students)
          .where(and(eq(students.coachId, user.id)));
        const ownedIds = new Set(owned.map((s) => s.id));
        if (!studentIds.every((sid) => ownedIds.has(sid))) {
          throw new Error("invalid_student");
        }
      }
      await tx.delete(groupStudents).where(eq(groupStudents.groupId, id));
      if (studentIds.length > 0) {
        await tx.insert(groupStudents).values(
          studentIds.map((studentId) => ({ groupId: id, studentId }))
        );
      }
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const [existing] = await db.select({ coachId: groups.coachId }).from(groups)
    .where(eq(groups.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.coachId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.delete(groups).where(eq(groups.id, id));
  return NextResponse.json({ ok: true });
}
