-- AI operations: usage ledger, cost settings, model controls and per-user limits.

CREATE TABLE IF NOT EXISTS ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_id uuid REFERENCES dr_planner_chats(id) ON DELETE SET NULL,
  provider varchar(40) DEFAULT 'anthropic' NOT NULL,
  model varchar(120) NOT NULL,
  operation varchar(80) DEFAULT 'dr_planner_chat' NOT NULL,
  input_tokens integer DEFAULT 0 NOT NULL,
  output_tokens integer DEFAULT 0 NOT NULL,
  total_tokens integer DEFAULT 0 NOT NULL,
  cache_read_tokens integer DEFAULT 0 NOT NULL,
  cache_write_tokens integer DEFAULT 0 NOT NULL,
  estimated_cost_usd numeric(12, 6) DEFAULT 0 NOT NULL,
  currency varchar(3) DEFAULT 'USD' NOT NULL,
  finish_reason varchar(80),
  request_id varchar(160),
  metadata json DEFAULT '{}'::json NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS ai_usage_events_user_created_idx
  ON ai_usage_events (user_id, created_at);
CREATE INDEX IF NOT EXISTS ai_usage_events_model_created_idx
  ON ai_usage_events (model, created_at);
CREATE INDEX IF NOT EXISTS ai_usage_events_created_at_idx
  ON ai_usage_events (created_at);

CREATE TABLE IF NOT EXISTS ai_user_restrictions (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_restricted boolean DEFAULT false NOT NULL,
  custom_message text,
  daily_token_limit integer,
  monthly_token_limit integer,
  model_override varchar(120),
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ai_user_restrictions_restricted_idx
  ON ai_user_restrictions (is_restricted);
CREATE INDEX IF NOT EXISTS ai_user_restrictions_model_idx
  ON ai_user_restrictions (model_override);

INSERT INTO app_settings (key, value, type, label, description, category, is_public)
VALUES
  ('ai.chat_provider', '"anthropic"', 'string', 'Proveedor IA', 'Proveedor usado por Dr. Planner. Actualmente Anthropic; queda preparado para otros proveedores.', 'IA', false),
  ('ai.dr_planner_model', '"claude-haiku-4-5"', 'string', 'Modelo Dr. Planner', 'Modelo principal del chat. Usa Haiku para reducir coste o Sonnet para más calidad.', 'IA', false),
  ('ai.reasoning_model', '"claude-sonnet-4-6"', 'string', 'Modelo análisis profundo', 'Modelo usado en insights internos, recomendaciones y análisis que requieren más criterio.', 'IA', false),
  ('ai.fallback_model', '"claude-haiku-4-5"', 'string', 'Modelo fallback', 'Modelo económico de reserva para degradar calidad cuando haga falta contener costes.', 'IA', false),
  ('ai.max_output_tokens', '2400', 'number', 'Salida máxima', 'Máximo de tokens de salida por turno de Dr. Planner.', 'IA', false),
  ('ai.default_temperature', '0.4', 'number', 'Temperatura Dr. Planner', 'Creatividad del modelo principal. Valores bajos dan respuestas más estables.', 'IA', false),
  ('ai.monthly_budget_usd', '50', 'number', 'Presupuesto mensual IA', 'Presupuesto mensual orientativo para mostrar presión de gasto en el panel.', 'IA', false),
  ('ai.default_daily_token_limit', '0', 'number', 'Límite diario por defecto', 'Tokens diarios por usuario. Usa 0 para ilimitado salvo restricciones individuales.', 'IA', false),
  ('ai.default_monthly_token_limit', '0', 'number', 'Límite mensual por defecto', 'Tokens mensuales por usuario. Usa 0 para ilimitado salvo restricciones individuales.', 'IA', false),
  ('ai.restriction_default_message', '"Dr. Planner está temporalmente limitado para tu cuenta. Contacta con soporte si necesitas ampliarlo."', 'string', 'Mensaje restricción IA', 'Mensaje por defecto para usuarios bloqueados o que superan límites.', 'IA', false),
  ('ai.pricing_json', to_json('{"claude-haiku-4-5":{"input":1,"output":5,"cacheWrite":1.25,"cacheRead":0.1},"claude-sonnet-4-6":{"input":3,"output":15,"cacheWrite":3.75,"cacheRead":0.3},"claude-sonnet-4-5":{"input":3,"output":15,"cacheWrite":3.75,"cacheRead":0.3},"claude-opus-4-6":{"input":5,"output":25,"cacheWrite":6.25,"cacheRead":0.5},"claude-opus-4-5":{"input":5,"output":25,"cacheWrite":6.25,"cacheRead":0.5}}'::text), 'string', 'Precios IA JSON', 'Coste por millón de tokens en USD. Edita este JSON si el proveedor cambia precios.', 'IA', false)
ON CONFLICT (key) DO UPDATE SET
  type = EXCLUDED.type,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_public = EXCLUDED.is_public,
  updated_at = now();

ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_restrictions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ai_usage_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ai_user_restrictions TO authenticated;

DROP POLICY IF EXISTS "ai_usage_events_read" ON ai_usage_events;
DROP POLICY IF EXISTS "ai_usage_events_owner_insert" ON ai_usage_events;
CREATE POLICY "ai_usage_events_read" ON ai_usage_events
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );
CREATE POLICY "ai_usage_events_owner_insert" ON ai_usage_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_user_restrictions_read" ON ai_user_restrictions;
DROP POLICY IF EXISTS "ai_user_restrictions_admin_write" ON ai_user_restrictions;
CREATE POLICY "ai_user_restrictions_read" ON ai_user_restrictions
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );
CREATE POLICY "ai_user_restrictions_admin_write" ON ai_user_restrictions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );
