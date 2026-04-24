import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { drPlannerChats } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ChatListClient } from "./chat-list-client";

export default async function DrPlannerListPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const chats = await db
    .select({
      id: drPlannerChats.id,
      title: drPlannerChats.title,
      createdAt: drPlannerChats.createdAt,
      updatedAt: drPlannerChats.updatedAt,
    })
    .from(drPlannerChats)
    .where(eq(drPlannerChats.userId, user.id))
    .orderBy(desc(drPlannerChats.updatedAt));

  return <ChatListClient chats={chats} />;
}
