import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AdminSidebar } from "./admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [row] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!row?.isAdmin) redirect("/dashboard");

  return (
    <div className="min-h-dvh flex flex-col bg-background md:flex-row">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
