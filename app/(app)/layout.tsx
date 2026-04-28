import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import AppShell from "@/components/app/app-shell";
import {
  getAppSettings,
  getStringSetting,
  isDrPlannerEnabled,
} from "@/lib/app-settings";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const avatarUrl = user.user_metadata?.avatar_url ?? null;

  const [
    [row],
    drPlannerEnabled,
    featureSettings,
    maintenanceBanner,
    appName,
    appTagline,
  ] = await Promise.all([
    db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1),
    isDrPlannerEnabled(),
    getAppSettings([
      "feature.session_templates_enabled",
      "feature.exercise_creation_enabled",
      "feature.groups_enabled",
      "feature.calendar_enabled",
    ]),
    getStringSetting("system.maintenance_banner", ""),
    getStringSetting("brand.app_name", "TenPlanner"),
    getStringSetting("brand.app_tagline", ""),
  ]);

  const isAdmin = row?.isAdmin ?? false;

  return (
    <AppShell
      user={user}
      avatarUrl={avatarUrl}
      isAdmin={isAdmin}
      drPlannerEnabled={drPlannerEnabled}
      features={{
        sessionTemplates:
          featureSettings.get("feature.session_templates_enabled") !== false,
        exerciseCreation:
          featureSettings.get("feature.exercise_creation_enabled") !== false,
        groups: featureSettings.get("feature.groups_enabled") !== false,
        calendar: featureSettings.get("feature.calendar_enabled") !== false,
      }}
      maintenanceBanner={maintenanceBanner}
      appName={appName}
      appTagline={appTagline}
    >
      {children}
    </AppShell>
  );
}
