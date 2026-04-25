import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { AdminUsersClient } from "./users-client";

export default async function AdminUsersPage() {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(200);

  const serialized = rows.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Usuarios
        </h1>
        <p className="text-sm text-foreground/50 mt-1">
          {rows.length} usuarios registrados
        </p>
      </div>
      <AdminUsersClient users={serialized} />
    </div>
  );
}
