import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const page = request.nextUrl.searchParams.get("page") ?? "1";

  if (!q) return NextResponse.json({ photos: [], total_results: 0 });

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
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=20&page=${page}`,
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
