import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { drPlannerChats } from "@/db/schema";
import { and, eq } from "drizzle-orm";

interface Ctx { params: Promise<{ id: string }> }

async function getAuthedChat(id: string, userId: string) {
  const [chat] = await db
    .select()
    .from(drPlannerChats)
    .where(and(eq(drPlannerChats.id, id), eq(drPlannerChats.userId, userId)))
    .limit(1);
  return chat ?? null;
}

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chat = await getAuthedChat(id, user.id);
  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: chat });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chat = await getAuthedChat(id, user.id);
  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as { messages?: Record<string, unknown>[]; title?: string };

  // Auto-title from first user message if still default
  let title = body.title;
  if (!title && chat.title === "Nueva conversación" && body.messages) {
    const firstUser = body.messages.find(m => (m as { role?: string }).role === "user");
    if (firstUser) {
      const parts = (firstUser as { parts?: Array<{ type: string; text?: string }> }).parts ?? [];
      const text = parts.find(p => p.type === "text")?.text ?? "";
      title = text.slice(0, 60).trim() || undefined;
    }
  }

  const [updated] = await db
    .update(drPlannerChats)
    .set({
      ...(body.messages !== undefined && { messages: body.messages }),
      ...(title && { title }),
    })
    .where(eq(drPlannerChats.id, id))
    .returning({ id: drPlannerChats.id, title: drPlannerChats.title });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chat = await getAuthedChat(id, user.id);
  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(drPlannerChats).where(eq(drPlannerChats.id, id));
  return NextResponse.json({ ok: true });
}
