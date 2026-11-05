import { eq, getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import * as schema from "@/db/schema";

// Copia de seguridad completa de los datos de la aplicación, descargable
// por un administrador desde Admin → Herramientas.
// Se excluyen los embeddings de IA: ocupan mucho y se pueden regenerar.
const EXCLUDED_TABLES = new Set(["ai_document_embeddings"]);

export const maxDuration = 60;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [row] = await db
    .select({ isAdmin: schema.users.isAdmin })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .limit(1);
  return row?.isAdmin ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tables = Object.values(schema as Record<string, unknown>).filter(
    (value): value is PgTable => is(value, PgTable)
  );

  const data: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  try {
    for (const table of tables) {
      const name = getTableName(table);
      if (EXCLUDED_TABLES.has(name)) continue;
      const rows = await db.select().from(table);
      data[name] = rows;
      counts[name] = rows.length;
    }
  } catch (error) {
    console.error("[admin/export]", error);
    return NextResponse.json(
      { error: "No se pudo generar la copia de seguridad" },
      { status: 500 }
    );
  }

  const exportedAt = new Date();
  const body = JSON.stringify(
    {
      app: "TenPlanner",
      format: "tenplanner-export-v1",
      exportedAt: exportedAt.toISOString(),
      note: "Copia de datos de la aplicación. No incluye contraseñas ni embeddings de IA. Contiene datos personales: guárdala en un lugar seguro.",
      counts,
      tables: data,
    },
    null,
    2
  );

  const stamp = exportedAt.toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="tenplanner-copia-${stamp}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
