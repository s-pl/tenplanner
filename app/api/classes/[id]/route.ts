import { NextResponse } from "next/server";
import { and, eq, asc, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  classes,
  classBlocks,
  classBlockExercises,
  exercises,
} from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { isPublicHttpUrl } from "@/lib/url-safety";

type Ctx = { params: Promise<{ id: string }> };

const blockExerciseSchema = z.object({
  exerciseId: z.string().uuid().optional().nullable(),
  freeText: z.string().trim().max(2000).optional().nullable(),
  durationMinutes: z.number().int().min(1).max(300).optional().nullable(),
});

const blockSchema = z.object({
  orderIndex: z.number().int().min(1).max(3),
  title: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  items: z.array(blockExerciseSchema).default([]),
});

const updateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  duracionMinutes: z.number().int().min(1).max(600).optional(),
  alumnosTipo: z.enum(["individual", "grupal"]).nullable().optional(),
  numAlumnos: z.number().int().min(1).max(60).nullable().optional(),
  objetivos: z.string().trim().max(4000).nullable().optional(),
  material: z.string().trim().max(2000).nullable().optional(),
  videoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value === "" || isPublicHttpUrl(value), {
      message: "La URL de video debe ser http(s) y no apuntar a una red local.",
    })
    .nullable()
    .optional()
    .or(z.literal("")),
  aspectosImportantes: z.string().trim().max(4000).nullable().optional(),
  nivel: z.string().trim().max(32).nullable().optional(),
  aspectoJuego: z.string().trim().max(16).nullable().optional(),
  golpes: z.array(z.string().max(32)).nullable().optional(),
  isLibrary: z.boolean().optional(),
  blocks: z.array(blockSchema).max(3).optional(),
});

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const [cls] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, id))
    .limit(1);
  if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Visibilidad: biblioteca pública o creador
  const isOwner = !!user && cls.createdBy === user.id;
  if (!cls.isLibrary && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const blocks = await db
    .select()
    .from(classBlocks)
    .where(eq(classBlocks.classId, id))
    .orderBy(asc(classBlocks.orderIndex));

  const items = blocks.length
    ? await db
        .select({
          blockId: classBlockExercises.blockId,
          exerciseId: classBlockExercises.exerciseId,
          freeText: classBlockExercises.freeText,
          orderIndex: classBlockExercises.orderIndex,
          durationMinutes: classBlockExercises.durationMinutes,
          exerciseName: exercises.name,
          exerciseCategory: exercises.category,
        })
        .from(classBlockExercises)
        .leftJoin(
          exercises,
          eq(exercises.id, classBlockExercises.exerciseId)
        )
        .where(
          or(
            ...blocks.map((b) => eq(classBlockExercises.blockId, b.id))
          )!
        )
        .orderBy(
          asc(classBlockExercises.blockId),
          asc(classBlockExercises.orderIndex)
        )
    : [];

  return NextResponse.json({
    data: {
      ...cls,
      blocks: blocks.map((b) => ({
        ...b,
        items: items.filter((i) => i.blockId === b.id),
      })),
    },
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 }
    );

  const [existing] = await db
    .select({ createdBy: classes.createdBy })
    .from(classes)
    .where(eq(classes.id, id))
    .limit(1);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.createdBy !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const d = parsed.data;

  // Verify exercises referenced in new blocks belong to user or are global
  if (d.blocks) {
    const exerciseIds = Array.from(
      new Set(
        d.blocks.flatMap((b) =>
          b.items.map((i) => i.exerciseId).filter((eid): eid is string => !!eid)
        )
      )
    );
    if (exerciseIds.length > 0) {
      const accessible = await db
        .select({ id: exercises.id })
        .from(exercises)
        .where(
          and(
            sql`${exercises.id} IN (${sql.join(
              exerciseIds.map((eid) => sql`${eid}::uuid`),
              sql`, `
            )})`,
            or(
              eq(exercises.isGlobal, true),
              eq(exercises.createdBy, user.id)
            )!
          )
        );
      if (accessible.length !== exerciseIds.length) {
        return NextResponse.json(
          { error: "Algunos ejercicios no son accesibles" },
          { status: 400 }
        );
      }
    }
  }

  try {
    await db.transaction(async (tx) => {
      const updateValues: Record<string, unknown> = {};
      if (d.name !== undefined) updateValues.name = d.name;
      if (d.duracionMinutes !== undefined)
        updateValues.duracionMinutes = d.duracionMinutes;
      if (d.alumnosTipo !== undefined)
        updateValues.alumnosTipo = d.alumnosTipo;
      if (d.numAlumnos !== undefined) updateValues.numAlumnos = d.numAlumnos;
      if (d.objetivos !== undefined) updateValues.objetivos = d.objetivos;
      if (d.material !== undefined) updateValues.material = d.material;
      if (d.videoUrl !== undefined)
        updateValues.videoUrl = d.videoUrl || null;
      if (d.aspectosImportantes !== undefined)
        updateValues.aspectosImportantes = d.aspectosImportantes;
      if (d.nivel !== undefined) updateValues.nivel = d.nivel;
      if (d.aspectoJuego !== undefined)
        updateValues.aspectoJuego = d.aspectoJuego;
      if (d.golpes !== undefined) updateValues.golpes = d.golpes;
      if (d.isLibrary !== undefined) updateValues.isLibrary = d.isLibrary;

      if (Object.keys(updateValues).length > 0) {
        await tx.update(classes).set(updateValues).where(eq(classes.id, id));
      }

      if (d.blocks !== undefined) {
        // Replace all blocks (cascade deletes existing block items)
        await tx.delete(classBlocks).where(eq(classBlocks.classId, id));
        for (const block of d.blocks) {
          const [createdBlock] = await tx
            .insert(classBlocks)
            .values({
              classId: id,
              orderIndex: block.orderIndex,
              title: block.title ?? null,
              notes: block.notes ?? null,
            })
            .returning({ id: classBlocks.id });
          if (block.items.length > 0) {
            await tx.insert(classBlockExercises).values(
              block.items.map((item, idx) => ({
                blockId: createdBlock.id,
                exerciseId: item.exerciseId ?? null,
                freeText: item.freeText ?? null,
                orderIndex: idx,
                durationMinutes: item.durationMinutes ?? null,
              }))
            );
          }
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error updating class:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [deleted] = await db
    .delete(classes)
    .where(and(eq(classes.id, id), eq(classes.createdBy, user.id)))
    .returning({ id: classes.id });
  if (!deleted)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
