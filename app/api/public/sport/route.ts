import { NextResponse } from "next/server";
import { z } from "zod";
import { SPORTS } from "@/lib/sport-constants";
import { PUBLIC_SPORT_COOKIE } from "@/lib/public-sport";

const bodySchema = z.object({ sport: z.enum(SPORTS) });

const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 días

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const res = NextResponse.json({ data: { sport: parsed.data.sport } });
  res.cookies.set(PUBLIC_SPORT_COOKIE, parsed.data.sport, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ data: { cleared: true } });
  res.cookies.set(PUBLIC_SPORT_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
