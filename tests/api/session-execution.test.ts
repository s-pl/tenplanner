import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const sessionLimit = vi.fn();
let existingExerciseRows: Array<{ exerciseId: string }> = [];
let selectWhereCall = 0;
const transaction = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => {
          selectWhereCall += 1;
          if (selectWhereCall === 1) {
            return { limit: sessionLimit };
          }
          return Promise.resolve(existingExerciseRows);
        }),
      })),
    })),
    transaction,
  },
}));

describe("PATCH /api/sessions/:id/execution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectWhereCall = 0;
    existingExerciseRows = [];
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    sessionLimit.mockResolvedValue([{ userId: "user-1" }]);
  });

  it("rejects execution rows for exercises outside the session", async () => {
    const { PATCH } = await import("@/app/api/sessions/[id]/execution/route");

    const res = await PATCH(
      new Request("http://localhost/api/sessions/session-1/execution", {
        method: "PATCH",
        body: JSON.stringify({
          exercises: [
            {
              exerciseId: "33333333-3333-4333-8333-333333333333",
              actualDurationSeconds: 300,
              completed: true,
            },
          ],
        }),
      }),
      { params: Promise.resolve({ id: "session-1" }) }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.invalidExerciseIds).toEqual([
      "33333333-3333-4333-8333-333333333333",
    ]);
    expect(transaction).not.toHaveBeenCalled();
  });
});
