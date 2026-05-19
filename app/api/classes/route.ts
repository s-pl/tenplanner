import { NextResponse } from "next/server";
import { eq, or, desc, and, ilike, sql } from "drizzle-orm";
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

const createSchema = z.object({
  name: z.string().trim().min(1).max(255),
  duracionMinutes: z.number().int().min(1).max(600),
  alumnosTipo: z.enum(["individual", "grupal"]).optional().nullable(),
  numAlumnos: z.number().int().min(1).max(60).optional().nullable(),
  objetivos: z.string().trim().max(4000).optional().nullable(),
  material: z.string().trim().max(2000).optional().nullable(),
  videoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value === "" || isPublicHttpUrl(value), {
      message: "La URL de video debe ser http(s) y no apuntar a una red local.",
    })
    .optional()
    .nullable()
    .or(z.literal("")),
  aspectosImportantes: z.string().trim().max(4000).optional().nullable(),
  nivel: z.string().trim().max(32).optional().nullable(),
  niveles: z.array(z.string().trim().max(32)).optional().nullable(),
  aspectoJuego: z.string().trim().max(16).optional().nullable(),
  aspectosJuego: z.array(z.string().trim().max(16)).optional().nullable(),
  golpes: z.array(z.string().max(32)).optional().nullable(),
  isLibrary: z.boolean().optional().default(false),
  blocks: z.array(blockSchema).max(3).default([]),
});

function normalizeMultiValue(
  values: string[] | null | undefined,
  legacyValue: string | null | undefined
) {
  const normalized = Array.from(
    new Set(
      (values ?? (legacyValue ? [legacyValue] : []))
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
  return normalized.length > 0 ? normalized : null;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") ?? "all";
  const q = searchParams.get("q")?.trim();
  const nivel = searchParams.get("nivel")?.trim();
  const aspecto = searchParams.get("aspecto")?.trim();

  const conds = [];
  if (tab === "mine" && user) {
    conds.push(eq(classes.createdBy, user.id));
  } else if (tab === "library") {
    conds.push(eq(classes.isLibrary, true));
  } else {
    // all: biblioteca pública + propias del usuario
    conds.push(
      user
        ? or(eq(classes.isLibrary, true), eq(classes.createdBy, user.id))!
        : eq(classes.isLibrary, true)
    );
  }
  if (q) conds.push(ilike(classes.name, `%${q}%`));
  if (nivel) {
    conds.push(
      or(
        sql`${classes.niveles} @> ${JSON.stringify([nivel])}::jsonb`,
        eq(classes.nivel, nivel)
      )!
    );
  }
  if (aspecto) {
    conds.push(
      or(
        sql`${classes.aspectosJuego} @> ${JSON.stringify([aspecto])}::jsonb`,
        eq(classes.aspectoJuego, aspecto)
      )!
    );
  }

  const rows = await db
    .select({
      id: classes.id,
      name: classes.name,
      duracionMinutes: classes.duracionMinutes,
      alumnosTipo: classes.alumnosTipo,
      numAlumnos: classes.numAlumnos,
      nivel: classes.nivel,
      niveles: classes.niveles,
      aspectoJuego: classes.aspectoJuego,
      aspectosJuego: classes.aspectosJuego,
      isLibrary: classes.isLibrary,
      createdBy: classes.createdBy,
      createdAt: classes.createdAt,
    })
    .from(classes)
    .where(and(...conds))
    .orderBy(desc(classes.createdAt))
    .limit(60);

  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 }
    );

  const d = parsed.data;
  const niveles = normalizeMultiValue(d.niveles, d.nivel);
  const aspectosJuego = normalizeMultiValue(d.aspectosJuego, d.aspectoJuego);

  // Verify exercises referenced belong to user or are library
  const exerciseIds = Array.from(
    new Set(
      d.blocks.flatMap((b) =>
        b.items.map((i) => i.exerciseId).filter((id): id is string => !!id)
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
            exerciseIds.map((id) => sql`${id}::uuid`),
            sql`, `
          )})`,
          or(eq(exercises.isGlobal, true), eq(exercises.createdBy, user.id))!
        )
      );
    if (accessible.length !== exerciseIds.length) {
      return NextResponse.json(
        { error: "Algunos ejercicios no son accesibles" },
        { status: 400 }
      );
    }
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(classes)
        .values({
          createdBy: user.id,
          name: d.name,
          duracionMinutes: d.duracionMinutes,
          alumnosTipo: d.alumnosTipo ?? null,
          numAlumnos: d.numAlumnos ?? null,
          objetivos: d.objetivos ?? null,
          material: d.material ?? null,
          videoUrl: d.videoUrl || null,
          aspectosImportantes: d.aspectosImportantes ?? null,
          nivel: niveles?.[0] ?? null,
          niveles,
          aspectoJuego: aspectosJuego?.[0] ?? null,
          aspectosJuego,
          golpes: d.golpes ?? null,
          isLibrary: d.isLibrary ?? false,
        })
        .returning();

      for (const block of d.blocks) {
        const [createdBlock] = await tx
          .insert(classBlocks)
          .values({
            classId: created.id,
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

      return created;
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    console.error("Error creating class:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
