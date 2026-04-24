import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getClientIp,
  rateLimit,
  tooManyRequestsResponse,
} from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const perUser = await rateLimit(`stock:user:${user.id}`, 30, 60_000);
  if (!perUser.ok) return tooManyRequestsResponse(perUser);
  const perIp = await rateLimit(
    `stock:ip:${getClientIp(request.headers)}`,
    60,
    60_000
  );
  if (!perIp.ok) return tooManyRequestsResponse(perIp);

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const pageParam = request.nextUrl.searchParams.get("page") ?? "1";
  const pageNum = Math.max(1, Math.min(50, Number.parseInt(pageParam, 10) || 1));

  if (!q) return NextResponse.json({ photos: [], total_results: 0 });
  if (q.length > 100) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "PEXELS_API_KEY no configurada. Añádela al .env para usar búsqueda de stock.",
      },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=20&page=${pageNum}`,
      { headers: { Authorization: apiKey }, next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`Pexels ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Error al buscar imágenes",
      },
      { status: 502 }
    );
  }
}
