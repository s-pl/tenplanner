import type { User } from "@supabase/supabase-js";
import { SidebarNav } from "./sidebar-nav";

interface AppShellProps {
  children: React.ReactNode;
  user: User;
  avatarUrl: string | null;
}

export default function AppShell({ children, user, avatarUrl }: AppShellProps) {
  return (
    <div className="flex flex-col md:flex-row h-dvh overflow-hidden bg-background">
      <SidebarNav user={user} avatarUrl={avatarUrl} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
