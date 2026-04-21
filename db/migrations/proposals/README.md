# Migration Proposals

These SQL files are **not** picked up by `pnpm db:migrate`. They document
schema changes that need deeper review / manual execution.

## `001_enable_rls.sql`

Enables Postgres Row Level Security on every user-owned table. Requires
switching the Drizzle client to a pg pool that sets `request.jwt.claims`
(or `auth.uid()`) per request using the Supabase JWT. With the current
`postgres(DATABASE_URL)` client we connect as a superuser, so RLS is
bypassed — applying this file alone does nothing until the client change
lands.

Plan:

1. Replace `db/index.ts` with a wrapper that wraps every query in
   `SET LOCAL request.jwt.claims = '…'` (or route all queries through
   `@supabase/ssr` `createClient().from(...)`).
2. Apply `001_enable_rls.sql`.
3. Keep API routes' `user.id` filters as defense in depth.

## `002_normalize_dr_planner_messages.sql`

Splits `dr_planner_chats.messages` (unbounded json) into a dedicated
`dr_planner_messages` table with one row per message. Required code
changes:

- `app/api/dr-planner/chats/[id]/route.ts` — read/write from the new
  table, paginate.
- `app/api/dr-planner/route.ts` — persist assistant messages as they
  stream rather than re-saving the whole blob from the client.

Apply only after the API has been updated to read/write the new shape;
otherwise the PATCH handler breaks.
