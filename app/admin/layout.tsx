import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { MaintenanceBanner } from "@/components/app/maintenance-banner";
import { getStringSetting } from "@/lib/app-settings";
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

  const [[row], [{ adminCount }], maintenanceBanner] = await Promise.all([
    db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1),
    db
      .select({ adminCount: count() })
      .from(users)
      .where(eq(users.isAdmin, true)),
    getStringSetting("system.maintenance_banner", ""),
  ]);

  // No admins yet → let this user set themselves up
  if (Number(adminCount) === 0) redirect("/setup");

  if (!row?.isAdmin) redirect("/dashboard");

  return (
    <div className="min-h-dvh flex flex-col bg-background md:flex-row">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
        <MaintenanceBanner message={maintenanceBanner} />
        {children}
      </main>
    </div>
  );
}
