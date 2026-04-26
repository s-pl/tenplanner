import type { User } from "@supabase/supabase-js";
import { SidebarNav } from "./sidebar-nav";

interface AppShellProps {
  children: React.ReactNode;
  user: User | null;
  avatarUrl: string | null;
  isAdmin?: boolean;
}

export default function AppShell({ children, user, avatarUrl, isAdmin = false }: AppShellProps) {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background md:flex-row">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at top left, color-mix(in oklab, var(--brand) 10%, transparent) 0, transparent 32%), radial-gradient(circle at top right, color-mix(in oklab, var(--foreground) 6%, transparent) 0, transparent 28%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--foreground) 3%, transparent) 1px, transparent 1px)",
          backgroundSize: "calc(100%/18) 100%",
        }}
      />
      <SidebarNav user={user} avatarUrl={avatarUrl} isAdmin={isAdmin} />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <main id="main" className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
