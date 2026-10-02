import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { devTasks } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  DEV_TASK_ASSIGNEES,
  DEV_TASK_STATUSES,
  isDevTaskUser,
} from "@/lib/dev-tasks";

type Context = { params: Promise<{ id: string }> };

async function requireDevTaskUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isDevTaskUser(user.email)) return null;
  return user;
}

const updateSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().min(1).optional(),
  assignedTo: z.enum(DEV_TASK_ASSIGNEES).optional(),
  status: z.enum(DEV_TASK_STATUSES).optional(),
  startDate: z.string().trim().min(1).nullable().optional(),
  endDate: z.string().trim().min(1).nullable().optional(),
  observaciones: z.string().trim().nullable().optional(),
});

export async function PATCH(request: Request, context: Context) {
  const user = await requireDevTaskUser();
  if (!user)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { startDate, endDate, observaciones, ...rest } = parsed.data;

  const [row] = await db
    .update(devTasks)
    .set({
      ...rest,
      ...(startDate !== undefined ? { startDate: startDate || null } : {}),
      ...(endDate !== undefined ? { endDate: endDate || null } : {}),
      ...(observaciones !== undefined
        ? { observaciones: observaciones || null }
        : {}),
    })
    .where(eq(devTasks.id, id))
    .returning();

  if (!row)
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  return NextResponse.json({ data: row });
}

export async function DELETE(_request: Request, context: Context) {
  const user = await requireDevTaskUser();
  if (!user)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await context.params;

  const [row] = await db
    .delete(devTasks)
    .where(eq(devTasks.id, id))
    .returning({ id: devTasks.id });

  if (!row)
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  return NextResponse.json({ data: { id: row.id } });
}
