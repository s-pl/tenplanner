import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { appSettings, users } from "@/db/schema";
import {
  getAppSettings,
  getSettingDefinition,
  normalizeSettingValue,
  SETTING_DEFINITIONS,
} from "@/lib/app-settings";
import { createClient } from "@/lib/supabase/server";

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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const values = await getAppSettings();
  return NextResponse.json({
    data: SETTING_DEFINITIONS.map((definition) => ({
      ...definition,
      value: values.get(definition.key) ?? definition.defaultValue,
    })),
  });
}

const updateSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
});

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const definition = getSettingDefinition(parsed.data.key);
  const value = normalizeSettingValue(parsed.data.key, parsed.data.value);
  if (!definition || value === null) {
    return NextResponse.json({ error: "Invalid setting" }, { status: 400 });
  }

  await db
    .insert(appSettings)
    .values({
      key: definition.key,
      value,
      type: definition.type,
      label: definition.label,
      description: definition.description,
      category: definition.category,
      isPublic: definition.isPublic,
      updatedBy: admin.id,
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value,
        type: definition.type,
        label: definition.label,
        description: definition.description,
        category: definition.category,
        isPublic: definition.isPublic,
        updatedAt: new Date(),
        updatedBy: admin.id,
      },
    });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/ai");
  revalidatePath("/dashboard");
  revalidatePath("/sessions");
  revalidatePath("/sessions/dr-planner");

  return NextResponse.json({ ok: true, data: { key: definition.key, value } });
}
