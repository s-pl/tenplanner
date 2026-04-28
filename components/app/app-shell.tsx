import type { User } from "@supabase/supabase-js";
import { MaintenanceBanner } from "./maintenance-banner";
import { SidebarNav } from "./sidebar-nav";

interface AppShellProps {
  children: React.ReactNode;
  user: User | null;
  avatarUrl: string | null;
  isAdmin?: boolean;
  drPlannerEnabled?: boolean;
  features?: {
    sessionTemplates?: boolean;
    exerciseCreation?: boolean;
    groups?: boolean;
    calendar?: boolean;
  };
  maintenanceBanner?: string;
  appName?: string;
  appTagline?: string;
}

export default function AppShell({
  children,
  user,
  avatarUrl,
  isAdmin = false,
  drPlannerEnabled = true,
  features,
  maintenanceBanner,
  appName,
  appTagline,
}: AppShellProps) {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background md:flex-row">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-brand/70"
      />
      <SidebarNav
        user={user}
        avatarUrl={avatarUrl}
        isAdmin={isAdmin}
        drPlannerEnabled={drPlannerEnabled}
        features={features}
        appName={appName}
        appTagline={appTagline}
      />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <MaintenanceBanner message={maintenanceBanner} />
        <main id="main" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
