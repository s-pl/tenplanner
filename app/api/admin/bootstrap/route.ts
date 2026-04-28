import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";

// One-time endpoint: promotes the calling authenticated user to admin.
// Only works if there are ZERO admins in the database.
// Once an admin exists, this endpoint becomes a no-op (403).
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(users)
    .where(eq(users.isAdmin, true));

  if (Number(total) > 0) {
    return NextResponse.json(
      {
        error:
          "Ya existe al menos un administrador. Pídele que te asigne el rol.",
      },
      { status: 403 }
    );
  }

  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!row) {
    return NextResponse.json(
      { error: "Usuario no encontrado en la base de datos." },
      { status: 404 }
    );
  }

  await db.update(users).set({ isAdmin: true }).where(eq(users.id, user.id));

  return NextResponse.json({
    ok: true,
    message: "Eres administrador. Recarga la página.",
  });
}
