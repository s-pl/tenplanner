import { and, count, desc, eq, ilike, type SQL } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exercises, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  createExerciseSchema,
  exercisesListQuerySchema,
  zodValidationErrorResponse,
} from "./validation";

function internalServerError() {
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const parsedQuery = exercisesListQuerySchema.safeParse({
    category: request.nextUrl.searchParams.get("category") ?? undefined,
    search: request.nextUrl.searchParams.get("search") ?? undefined,
    page: request.nextUrl.searchParams.get("page") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  if (!parsedQuery.success) {
    return zodValidationErrorResponse(parsedQuery.error);
  }

  const { category, search, page, limit } = parsedQuery.data;
  const offset = (page - 1) * limit;
  const whereConditions: SQL[] = [];

  if (category) {
    whereConditions.push(eq(exercises.category, category));
  }

  if (search) {
    whereConditions.push(ilike(exercises.name, `%${search}%`));
  }

  const whereClause =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  try {
    const listBaseQuery = db
      .select({
        id: exercises.id,
        name: exercises.name,
        description: exercises.description,
        category: exercises.category,
        difficulty: exercises.difficulty,
        durationMinutes: exercises.durationMinutes,
        createdBy: exercises.createdBy,
        createdAt: exercises.createdAt,
        updatedAt: exercises.updatedAt,
      })
      .from(exercises);

    const items = await (
      whereClause ? listBaseQuery.where(whereClause) : listBaseQuery
    )
      .orderBy(desc(exercises.createdAt))
      .limit(limit)
      .offset(offset);

    const countBaseQuery = db.select({ total: count() }).from(exercises);
    const totalResult = await (whereClause
      ? countBaseQuery.where(whereClause)
      : countBaseQuery);

    const total = Number(totalResult[0]?.total ?? 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
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

  const parsedBody = createExerciseSchema.safeParse(body);

  if (!parsedBody.success) {
    return zodValidationErrorResponse(parsedBody.error);
  }

  if (!user.email) {
    return NextResponse.json(
      { error: "User email is required" },
      { status: 403 }
    );
  }

  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : user.email;

  try {
    await db
      .insert(users)
      .values({
        id: user.id,
        name: metadataName,
        email: user.email,
        image:
          typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : null,
      })
      .onConflictDoNothing();

    const [createdExercise] = await db
      .insert(exercises)
      .values({
        ...parsedBody.data,
        description: parsedBody.data.description ?? null,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ data: createdExercise }, { status: 201 });
  } catch {
    return internalServerError();
  }
}
