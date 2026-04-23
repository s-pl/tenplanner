import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { drPlannerChats, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function getDbErrorCode(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }
  return null;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chats = await db
    .select({
      id: drPlannerChats.id,
      title: drPlannerChats.title,
      createdAt: drPlannerChats.createdAt,
      updatedAt: drPlannerChats.updatedAt,
    })
    .from(drPlannerChats)
    .where(eq(drPlannerChats.userId, user.id))
    .orderBy(desc(drPlannerChats.updatedAt));

  return NextResponse.json({ data: chats });
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!user.email) {
    return NextResponse.json(
      { error: "No se pudo validar el correo de la cuenta." },
      { status: 400 }
    );
  }

  try {
    // Self-heal for users that exist in auth.users but are missing in public.users.
    await db
      .insert(users)
      .values({
        id: user.id,
        name:
          user.user_metadata.full_name ??
          user.email.split("@")[0] ??
          "Usuario",
        email: user.email,
        image: user.user_metadata.avatar_url ?? null,
      })
      .onConflictDoNothing();

    const [chat] = await db
      .insert(drPlannerChats)
      .values({ userId: user.id })
      .returning({ id: drPlannerChats.id });

    return NextResponse.json({ data: chat }, { status: 201 });
  } catch (error) {
    const code = getDbErrorCode(error);
    console.error("Error creating Dr. Planner chat", {
      code,
      userId: user.id,
      error,
    });

    if (code === "42P01") {
      return NextResponse.json(
        { error: "La base de datos no tiene la tabla de Dr. Planner." },
        { status: 500 }
      );
    }

    if (code === "42501") {
      return NextResponse.json(
        { error: "Permisos insuficientes en base de datos para crear el chat." },
        { status: 500 }
      );
    }

    if (code === "23503") {
      return NextResponse.json(
        { error: "No se encontró el perfil del usuario en la base de datos." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "No se pudo crear la conversación." },
      { status: 500 }
    );
  }
}
