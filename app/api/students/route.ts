import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { createStudentSchema, zodValidationErrorResponse } from "./validation";

function internalServerError() {
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

async function ensureUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  if (!user.email) return;
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : user.email;
  await db
    .insert(users)
    .values({ id: user.id, name: metadataName, email: user.email })
    .onConflictDoNothing();
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await db
      .select()
      .from(students)
      .where(eq(students.coachId, user.id))
      .orderBy(asc(students.name));

    return NextResponse.json({ data: rows });
  } catch {
    return internalServerError();
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createStudentSchema.safeParse(body);
  if (!parsed.success) {
    return zodValidationErrorResponse(parsed.error);
  }

  try {
    await ensureUser(user);

    const d = parsed.data;
    const [created] = await db
      .insert(students)
      .values({
        coachId: user.id,
        name: d.name,
        email: d.email ? d.email : null,
        gender: d.gender ?? null,
        birthDate: d.birthDate ?? null,
        heightCm: d.heightCm ?? null,
        weightKg: d.weightKg ?? null,
        dominantHand: d.dominantHand ?? null,
        playerLevel: d.playerLevel ?? null,
        yearsExperience: d.yearsExperience ?? null,
        notes: d.notes ?? null,
        imageUrl: d.imageUrl ?? null,
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch {
    return internalServerError();
  }
}
