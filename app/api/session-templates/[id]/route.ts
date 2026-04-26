import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { exercises, sessionTemplateExercises, sessionTemplates, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateTemplateSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    objective: z.string().trim().max(2000).optional().nullable(),
    durationMinutes: z.number().int().min(1).max(600).optional(),
    intensity: z.number().int().min(1).max(5).optional().nullable(),
    tags: z
      .array(z.string().trim().min(1).max(30))
      .max(10)
      .optional()
      .nullable(),
    location: z.string().trim().max(50).optional().nullable(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [template] = await db
    .select({
      id: sessionTemplates.id,
      authorId: sessionTemplates.authorId,
      authorName: users.name,
      title: sessionTemplates.title,
      description: sessionTemplates.description,
      objective: sessionTemplates.objective,
      durationMinutes: sessionTemplates.durationMinutes,
      intensity: sessionTemplates.intensity,
      tags: sessionTemplates.tags,
      location: sessionTemplates.location,
      adoptionsCount: sessionTemplates.adoptionsCount,
      createdAt: sessionTemplates.createdAt,
      updatedAt: sessionTemplates.updatedAt,
    })
    .from(sessionTemplates)
    .leftJoin(users, eq(sessionTemplates.authorId, users.id))
    .where(eq(sessionTemplates.id, id))
    .limit(1);

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const templateExercises = await db
    .select({
      id: sessionTemplateExercises.id,
      orderIndex: sessionTemplateExercises.orderIndex,
      durationMinutes: sessionTemplateExercises.durationMinutes,
      notes: sessionTemplateExercises.notes,
      phase: sessionTemplateExercises.phase,
      intensity: sessionTemplateExercises.intensity,
      exercise: {
        id: exercises.id,
        name: exercises.name,
        description: exercises.description,
        category: exercises.category,
        difficulty: exercises.difficulty,
        durationMinutes: exercises.durationMinutes,
        imageUrl: exercises.imageUrl,
        imageUrls: exercises.imageUrls,
      },
    })
    .from(sessionTemplateExercises)
    .leftJoin(exercises, eq(sessionTemplateExercises.exerciseId, exercises.id))
    .where(eq(sessionTemplateExercises.templateId, id))
    .orderBy(asc(sessionTemplateExercises.orderIndex));

  return NextResponse.json({ data: { ...template, exercises: templateExercises } });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ authorId: sessionTemplates.authorId })
    .from(sessionTemplates)
    .where(eq(sessionTemplates.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.authorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { title, description, objective, durationMinutes, intensity, tags, location } =
    parsed.data;

  const [updated] = await db
    .update(sessionTemplates)
    .set({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(objective !== undefined && { objective }),
      ...(durationMinutes !== undefined && { durationMinutes }),
      ...(intensity !== undefined && { intensity }),
      ...(tags !== undefined && { tags }),
      ...(location !== undefined && { location }),
      updatedAt: new Date(),
    })
    .where(eq(sessionTemplates.id, id))
    .returning();

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ authorId: sessionTemplates.authorId })
    .from(sessionTemplates)
    .where(eq(sessionTemplates.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.authorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(sessionTemplates).where(eq(sessionTemplates.id, id));

  return new NextResponse(null, { status: 204 });
}
