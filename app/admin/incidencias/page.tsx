import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { devTasks } from "@/db/schema";
import { isDevTaskUser } from "@/lib/dev-tasks";
import { AdminPageHeader, adminPageShell } from "../_components/admin-ui";
import { IncidenciasClient } from "./incidencias-client";

export default async function IncidenciasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isDevTaskUser(user.email)) redirect("/admin");

  const tasks = await db
    .select()
    .from(devTasks)
    .orderBy(desc(devTasks.createdAt));

  return (
    <div className={adminPageShell}>
      <AdminPageHeader
        eyebrow="Privado · David & Darío"
        title="Incidencias"
        description="Seguimiento de las tareas de desarrollo de Ten Planner entre los dos. Solo vosotros veis esta página."
      />

      <IncidenciasClient
        initialTasks={tasks.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
