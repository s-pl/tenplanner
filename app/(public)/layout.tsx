import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import AppShell from "@/components/app/app-shell";
import { getAppSettings } from "@/lib/app-settings";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [adminRows, appSettings] = await Promise.all([
    user
      ? db
          .select({ isAdmin: users.isAdmin, image: users.image })
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1)
      : Promise.resolve([] as { isAdmin: boolean | null; image: string | null }[]),
    getAppSettings(["system.maintenance_banner", "feature.dr_planner_enabled"]),
  ]);

  const isAdmin = adminRows[0]?.isAdmin ?? false;
  const avatarUrl =
    adminRows[0]?.image ??
    (typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null);
  const maintenanceBanner =
    typeof appSettings.get("system.maintenance_banner") === "string"
      ? String(appSettings.get("system.maintenance_banner"))
      : "";
  const drPlannerEnabled =
    appSettings.get("feature.dr_planner_enabled") === true;

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
