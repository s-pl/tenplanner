import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { drPlannerChats, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ChatListClient } from "./chat-list-client";
import { isDrPlannerEnabled } from "@/lib/app-settings";
import { DrPlannerLocked } from "@/components/app/dr-planner/dr-planner-locked";

export default async function DrPlannerListPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const [enabled, profile] = await Promise.all([
    isDrPlannerEnabled(),
    db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1),
  ]);

  if (!enabled) {
    return <DrPlannerLocked isAdmin={profile[0]?.isAdmin ?? false} />;
  }

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
