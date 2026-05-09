import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import AppShell from "@/components/app/app-shell";
import { getStringSetting, isDrPlannerEnabled } from "@/lib/app-settings";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const avatarUrl = user?.user_metadata?.avatar_url ?? null;

  const [adminRows, maintenanceBanner, drPlannerEnabled] = await Promise.all([
    user
      ? db
          .select({ isAdmin: users.isAdmin })
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1)
      : Promise.resolve([] as { isAdmin: boolean | null }[]),
    getStringSetting("system.maintenance_banner", ""),
    isDrPlannerEnabled(),
  ]);

  const isAdmin = adminRows[0]?.isAdmin ?? false;

  return (
    <AppShell
      user={user}
      avatarUrl={avatarUrl}
      isAdmin={isAdmin}
      drPlannerEnabled={drPlannerEnabled}
      maintenanceBanner={maintenanceBanner}
    >
      {children}
    </AppShell>
  );
}
