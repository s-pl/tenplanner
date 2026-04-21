-- Split dr_planner_chats.messages (unbounded json column) into its own table.
-- Aplicar DESPUÉS de que las rutas /api/dr-planner/chats/[id] escriban/lean
-- en dr_planner_messages (ya migradas en este commit).
--
-- Flujo recomendado:
--   1. pnpm drizzle-kit generate    → genera 0012_*.sql + snapshot coherente
--                                     con el cambio en db/schema.ts.
--   2. Editar ese 0012 para añadir el BACKFILL antes del DROP COLUMN
--      (drizzle-kit no sabe copiar datos).
--   3. pnpm drizzle-kit migrate

CREATE TABLE IF NOT EXISTS dr_planner_messages (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id       uuid        NOT NULL REFERENCES dr_planner_chats(id) ON DELETE CASCADE,
  role          varchar(20) NOT NULL,
  parts         json        NOT NULL,
  order_index   integer     NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dr_planner_messages_chat_order_idx
  ON dr_planner_messages (chat_id, order_index);

-- Backfill desde el blob json existente
INSERT INTO dr_planner_messages (chat_id, role, parts, order_index)
SELECT
  c.id AS chat_id,
  COALESCE(m->>'role', 'assistant') AS role,
  COALESCE(m->'parts', '[]'::json) AS parts,
  (ord - 1)::int AS order_index
FROM dr_planner_chats c
CROSS JOIN LATERAL json_array_elements(c.messages) WITH ORDINALITY AS t(m, ord)
WHERE c.messages IS NOT NULL
  AND json_array_length(c.messages) > 0
ON CONFLICT DO NOTHING;

-- Verificar backfill antes de descomentar:
--   SELECT c.id, json_array_length(c.messages) AS old_count,
--          (SELECT count(*) FROM dr_planner_messages m WHERE m.chat_id = c.id) AS new_count
--   FROM dr_planner_chats c;
--
-- ALTER TABLE dr_planner_chats DROP COLUMN messages;
