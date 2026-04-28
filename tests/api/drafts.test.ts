import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const selectLimit = vi.fn();
const updateReturning = vi.fn();
const insertReturning = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: selectLimit,
          orderBy: vi.fn(async () => []),
        })),
        orderBy: vi.fn(async () => []),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: updateReturning,
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => ({
          returning: insertReturning,
        })),
        returning: insertReturning,
      })),
    })),
  },
}));

describe("POST draft APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    selectLimit.mockResolvedValue([]);
    updateReturning.mockResolvedValue([]);
    insertReturning.mockResolvedValue([{ id: "draft-1", userId: "user-1" }]);
  });

  it("rejects overwriting another user's session draft id", async () => {
    selectLimit.mockResolvedValueOnce([
      {
        id: "11111111-1111-4111-8111-111111111111",
        userId: "user-2",
      },
    ]);

    const { POST } = await import("@/app/api/session-drafts/route");
    const res = await POST(
      new Request("http://localhost/api/session-drafts", {
        method: "POST",
        body: JSON.stringify({
          id: "11111111-1111-4111-8111-111111111111",
          payload: { title: "Nope" },
        }),
      })
    );

    expect(res.status).toBe(403);
    expect(updateReturning).not.toHaveBeenCalled();
    expect(insertReturning).not.toHaveBeenCalled();
  });

  it("rejects overwriting another user's exercise draft id", async () => {
    selectLimit.mockResolvedValueOnce([
      {
        id: "22222222-2222-4222-8222-222222222222",
        userId: "user-2",
      },
    ]);

    const { POST } = await import("@/app/api/exercise-drafts/route");
    const res = await POST(
      new Request("http://localhost/api/exercise-drafts", {
        method: "POST",
        body: JSON.stringify({
          id: "22222222-2222-4222-8222-222222222222",
          payload: { name: "Nope" },
        }),
      })
    );

    expect(res.status).toBe(403);
    expect(updateReturning).not.toHaveBeenCalled();
    expect(insertReturning).not.toHaveBeenCalled();
  });
});
