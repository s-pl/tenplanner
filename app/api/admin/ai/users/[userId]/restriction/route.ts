import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { aiUserRestrictions, users } from "@/db/schema";
import { isKnownAiModel } from "@/lib/ai/model-options";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ userId: string }> };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [row] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return row?.isAdmin ? user : null;
}

const restrictionSchema = z.object({
  isRestricted: z.boolean(),
  customMessage: z.string().max(500).nullable().optional(),
  dailyTokenLimit: z.number().int().min(0).nullable().optional(),
  monthlyTokenLimit: z.number().int().min(0).nullable().optional(),
  modelOverride: z.string().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export async function PATCH(request: Request, context: Context) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await context.params;
  const userIdResult = z.string().uuid().safeParse(userId);
  if (!userIdResult.success) {
    return NextResponse.json({ error: "Usuario inválido" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = restrictionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (parsed.data.modelOverride && !isKnownAiModel(parsed.data.modelOverride)) {
    return NextResponse.json(
      { error: "Modelo IA no permitido" },
      { status: 400 }
    );
  }

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userIdResult.data))
    .limit(1);
  if (!target)
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );

  const values = {
    userId: userIdResult.data,
    isRestricted: parsed.data.isRestricted,
    customMessage: parsed.data.customMessage?.trim() || null,
    dailyTokenLimit: parsed.data.dailyTokenLimit ?? null,
    monthlyTokenLimit: parsed.data.monthlyTokenLimit ?? null,
    modelOverride: parsed.data.modelOverride ?? null,
    notes: parsed.data.notes?.trim() || null,
    updatedBy: admin.id,
  };

  const [updated] = await db
    .insert(aiUserRestrictions)
    .values(values)
    .onConflictDoUpdate({
      target: aiUserRestrictions.userId,
      set: {
        isRestricted: values.isRestricted,
        customMessage: values.customMessage,
        dailyTokenLimit: values.dailyTokenLimit,
        monthlyTokenLimit: values.monthlyTokenLimit,
        modelOverride: values.modelOverride,
        notes: values.notes,
        updatedAt: new Date(),
        updatedBy: admin.id,
      },
    })
    .returning({
      isRestricted: aiUserRestrictions.isRestricted,
      customMessage: aiUserRestrictions.customMessage,
      dailyTokenLimit: aiUserRestrictions.dailyTokenLimit,
      monthlyTokenLimit: aiUserRestrictions.monthlyTokenLimit,
      modelOverride: aiUserRestrictions.modelOverride,
      notes: aiUserRestrictions.notes,
    });

  revalidatePath("/admin/ai");

  return NextResponse.json({ data: updated });
}
