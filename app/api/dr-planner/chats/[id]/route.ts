import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { drPlannerChats, drPlannerMessages } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";

interface Ctx {
  params: Promise<{ id: string }>;
}

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chat = await getAuthedChat(id, user.id);
  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db
    .select({
      id: drPlannerMessages.id,
      role: drPlannerMessages.role,
      parts: drPlannerMessages.parts,
    })
    .from(drPlannerMessages)
    .where(eq(drPlannerMessages.chatId, id))
    .orderBy(asc(drPlannerMessages.orderIndex));

  return NextResponse.json({
    data: {
      ...chat,
      messages: rows.map((r) => ({ id: r.id, role: r.role, parts: r.parts })),
    },
  });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chat = await getAuthedChat(id, user.id);
  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as {
    messages?: Array<{
      id?: string;
      role?: string;
      parts?: Record<string, unknown>[];
    }>;
    title?: string;
  };

  let title = body.title;
  if (!title && chat.title === "Nueva conversación" && body.messages) {
    const firstUser = body.messages.find((m) => m.role === "user");
    if (firstUser) {
      const parts = (firstUser.parts ?? []) as Array<{
        type: string;
        text?: string;
      }>;
      const text = parts.find((p) => p.type === "text")?.text ?? "";
      title = text.slice(0, 60).trim() || undefined;
    }
  }

  await db.transaction(async (tx) => {
    if (body.messages !== undefined) {
      await tx.delete(drPlannerMessages).where(eq(drPlannerMessages.chatId, id));
      if (body.messages.length > 0) {
        await tx.insert(drPlannerMessages).values(
          body.messages.map((m, i) => ({
            chatId: id,
            role: m.role ?? "assistant",
            parts: m.parts ?? [],
            orderIndex: i,
          }))
        );
      }
    }
    if (title) {
      await tx
        .update(drPlannerChats)
        .set({ title })
        .where(eq(drPlannerChats.id, id));
    } else {
      // Touch updatedAt so list ordering reflects the latest activity
      await tx
        .update(drPlannerChats)
        .set({ updatedAt: new Date() })
        .where(eq(drPlannerChats.id, id));
    }
  });

  const [updated] = await db
    .select({ id: drPlannerChats.id, title: drPlannerChats.title })
    .from(drPlannerChats)
    .where(eq(drPlannerChats.id, id))
    .limit(1);

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chat = await getAuthedChat(id, user.id);
  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(drPlannerChats).where(eq(drPlannerChats.id, id));
  return NextResponse.json({ ok: true });
}
