import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { drPlannerChats, drPlannerMessages } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { DrPlannerChat } from "./chat-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DrPlannerChatPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [chat] = await db
    .select({ title: drPlannerChats.title })
    .from(drPlannerChats)
    .where(and(eq(drPlannerChats.id, id), eq(drPlannerChats.userId, user.id)))
    .limit(1);

  if (!chat) notFound();

  const rows = await db
    .select({
      id: drPlannerMessages.id,
      role: drPlannerMessages.role,
      parts: drPlannerMessages.parts,
    })
    .from(drPlannerMessages)
    .where(eq(drPlannerMessages.chatId, id))
    .orderBy(asc(drPlannerMessages.orderIndex));

  return (
    <DrPlannerChat
      chatId={id}
      initialTitle={chat.title}
      initialMessages={rows as unknown as Record<string, unknown>[]}
    />
  );
}
