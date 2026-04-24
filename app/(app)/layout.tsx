import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) redirect("/login");

  const avatarUrl = user.user_metadata?.avatar_url ?? null;

  return (
    <AppShell user={user} avatarUrl={avatarUrl}>
      {children}
    </AppShell>
  );
}
