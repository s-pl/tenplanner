import type { User } from "@supabase/supabase-js";
import { SidebarNav } from "./sidebar-nav";

interface AppShellProps {
  children: React.ReactNode;
  user: User;
}

export default function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <SidebarNav user={user} />
      <div className="flex-1 flex flex-col overflow-hidden md:h-dvh">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
