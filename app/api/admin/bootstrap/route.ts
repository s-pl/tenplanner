import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  getClientIp,
  rateLimit,
  tooManyRequestsResponse,
} from "@/lib/rate-limit";

// One-time endpoint: promotes the calling authenticated user to admin.
// Only works if there are ZERO admins in the database.
// Once an admin exists, this endpoint becomes a no-op (403).
export async function POST(request: Request) {
  const limit = await rateLimit(
    `admin-bootstrap:${getClientIp(request.headers)}`,
    5,
    15 * 60_000
  );
  if (!limit.ok) return tooManyRequestsResponse(limit);

  const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN?.trim();
  if (bootstrapToken) {
    const provided = request.headers.get("x-bootstrap-token")?.trim();
    if (provided !== bootstrapToken) {
      return NextResponse.json({ error: "Token inválido" }, { status: 403 });
    }
  }

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
