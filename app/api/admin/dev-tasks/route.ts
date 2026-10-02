import { desc } from "drizzle-orm";
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

async function requireDevTaskUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isDevTaskUser(user.email)) return null;
  return user;
}

const createSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1),
  assignedTo: z.enum(DEV_TASK_ASSIGNEES),
  status: z.enum(DEV_TASK_STATUSES).optional(),
  startDate: z.string().trim().min(1).nullable().optional(),
  endDate: z.string().trim().min(1).nullable().optional(),
  observaciones: z.string().trim().nullable().optional(),
});

export async function GET() {
  const user = await requireDevTaskUser();
  if (!user)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const rows = await db
    .select()
    .from(devTasks)
    .orderBy(desc(devTasks.createdAt));

  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const user = await requireDevTaskUser();
  if (!user)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const {
    title,
    description,
    assignedTo,
    status,
    startDate,
    endDate,
    observaciones,
  } = parsed.data;

  const [row] = await db
    .insert(devTasks)
    .values({
      title,
      description,
      assignedTo,
      status: status ?? "pendiente",
      startDate: startDate || null,
      endDate: endDate || null,
      observaciones: observaciones || null,
      createdBy: user.id,
    })
    .returning();

  return NextResponse.json({ data: row }, { status: 201 });
}
