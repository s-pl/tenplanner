import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  })),
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({ offset: vi.fn(async () => []) })),
          })),
        })),
      })),
    })),
  },
}));

describe("GET /api/sessions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/sessions/route");
    const url = "http://localhost/api/sessions";
    const req = new Request(
      url
    ) as unknown as import("next/server").NextRequest;
    Object.defineProperty(req, "nextUrl", { value: new URL(url) });

    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });
});
