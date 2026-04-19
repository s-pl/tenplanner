import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { drPlannerChats } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { DrPlannerChat } from "./chat-client";

interface PageProps { params: Promise<{ id: string }> }

export default async function DrPlannerChatPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [chat] = await db
    .select()
    .from(drPlannerChats)
    .where(and(eq(drPlannerChats.id, id), eq(drPlannerChats.userId, user.id)))
    .limit(1);

  if (!chat) notFound();

  return (
    <DrPlannerChat
      chatId={id}
      initialTitle={chat.title}
      initialMessages={chat.messages as Record<string, unknown>[]}
    />
  );
}
