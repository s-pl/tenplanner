import { and, desc, eq, ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessionTemplateExercises, sessionTemplates, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { getAccessibleExerciseDurationMap } from "@/lib/exercise-access";
import { z } from "zod";

const phaseSchema = z.enum(["activation", "main", "cooldown"]);

const templateExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  orderIndex: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(1).max(300).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  phase: phaseSchema.optional().nullable(),
  intensity: z.number().int().min(1).max(5).optional().nullable(),
});

const createTemplateSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).optional().nullable(),
  objective: z.string().trim().max(2000).optional().nullable(),
  durationMinutes: z.number().int().min(1).max(600),
  intensity: z.number().int().min(1).max(5).optional().nullable(),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(10)
    .optional()
    .nullable(),
  location: z.string().trim().max(50).optional().nullable(),
  exercises: z.array(templateExerciseSchema).max(40).optional().default([]),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q") ?? undefined;
  const filter = request.nextUrl.searchParams.get("filter") ?? "all";
  const tag = request.nextUrl.searchParams.get("tag") ?? undefined;

  const conditions = [];

  if (q) {
    conditions.push(ilike(sessionTemplates.title, `%${q}%`));
  }

  if (filter === "mine") {
    conditions.push(eq(sessionTemplates.authorId, user.id));
  }

  const rows = await db
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
    })
    .from(sessionTemplates)
    .leftJoin(users, eq(sessionTemplates.authorId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(sessionTemplates.adoptionsCount), desc(sessionTemplates.createdAt))
    .limit(50);

  const filtered = tag
    ? rows.filter((r) => Array.isArray(r.tags) && r.tags.includes(tag))
    : rows;

  return NextResponse.json({ data: filtered });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data" },
      { status: 400 }
    );
  }

  const {
    title,
    description,
    objective,
    durationMinutes,
    intensity,
    tags,
    location,
    exercises: exerciseItems,
  } = parsed.data;

  if (exerciseItems.length > 0) {
    const { inaccessibleIds } = await getAccessibleExerciseDurationMap(
      user.id,
      exerciseItems.map((item) => item.exerciseId)
    );
    if (inaccessibleIds.length > 0) {
      return NextResponse.json(
        { error: "Algunos ejercicios no existen o no son accesibles" },
        { status: 400 }
      );
    }
  }

  const [template] = await db
    .insert(sessionTemplates)
    .values({
      authorId: user.id,
      title,
      description: description ?? null,
      objective: objective ?? null,
      durationMinutes,
      intensity: intensity ?? null,
      tags: tags ?? null,
      location: location ?? null,
    })
    .returning();

  if (exerciseItems.length) {
    await db.insert(sessionTemplateExercises).values(
      exerciseItems.map((e, i) => ({
        templateId: template.id,
        exerciseId: e.exerciseId,
        orderIndex: e.orderIndex ?? i,
        durationMinutes: e.durationMinutes ?? null,
        notes: e.notes ?? null,
        phase: e.phase ?? null,
        intensity: e.intensity ?? null,
      }))
    );
  }

  return NextResponse.json({ data: template }, { status: 201 });
}
