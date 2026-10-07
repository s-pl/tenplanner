import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SPORTS, isSport } from "@/lib/sports";
import { getActiveSport, setActiveSport } from "@/lib/sports-server";

const bodySchema = z.object({
  sport: z.enum(SPORTS.map((s) => s.id) as [string, ...string[]]),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activeSport = await getActiveSport(user.id);
  return NextResponse.json({ data: { activeSport, options: SPORTS } });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success || !isSport(parsed.data.sport))
    return NextResponse.json(
      { error: parsed.success ? "invalid_sport" : parsed.error.flatten() },
      { status: 422 }
    );

  await setActiveSport(user.id, parsed.data.sport);

  return NextResponse.json({
    ok: true,
    data: { activeSport: parsed.data.sport },
  });
}
