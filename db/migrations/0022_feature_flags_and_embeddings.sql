-- Admin feature flags and pgvector-backed semantic search foundations.

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_embedding_source') THEN
    CREATE TYPE ai_embedding_source AS ENUM ('exercise', 'session');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS app_settings (
  key varchar(120) PRIMARY KEY,
  value json NOT NULL,
  type varchar(20) DEFAULT 'boolean' NOT NULL,
  label varchar(200) NOT NULL,
  description text,
  category varchar(80) DEFAULT 'general' NOT NULL,
  is_public boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS app_settings_category_idx
  ON app_settings (category);
CREATE INDEX IF NOT EXISTS app_settings_public_idx
  ON app_settings (is_public);

INSERT INTO app_settings (key, value, type, label, description, category, is_public)
VALUES
  ('feature.dr_planner_enabled', 'true', 'boolean', 'Dr. Planner', 'Activa o bloquea el asistente IA en navegación, páginas y API.', 'Funciones', true),
  ('feature.ai_insights_enabled', 'true', 'boolean', 'Insights IA en dashboard', 'Muestra el bloque de insights proactivos en el inicio.', 'Funciones', true),
  ('feature.session_templates_enabled', 'true', 'boolean', 'Plantillas de sesión', 'Permite mostrar y usar el mercado de plantillas.', 'Funciones', true),
  ('feature.public_exercises_enabled', 'true', 'boolean', 'Biblioteca global', 'Permite que los usuarios vean ejercicios globales.', 'Funciones', true),
  ('feature.exercise_creation_enabled', 'true', 'boolean', 'Crear ejercicios', 'Permite crear ejercicios manualmente desde la aplicación.', 'Funciones', true),
  ('feature.session_creation_enabled', 'true', 'boolean', 'Crear sesiones', 'Permite crear sesiones manualmente desde la aplicación.', 'Funciones', true),
  ('ai.semantic_search_enabled', 'false', 'boolean', 'Búsqueda semántica IA', 'Activa la recuperación por embeddings cuando el índice esté poblado.', 'IA', true),
  ('ai.embedding_model', '"text-embedding-3-small"', 'string', 'Modelo de embeddings', 'Modelo usado por los jobs que generen embeddings.', 'IA', false),
  ('ai.embedding_dimensions', '1536', 'number', 'Dimensiones embeddings', 'Debe coincidir con la dimensión de la columna vectorial.', 'IA', false),
  ('system.maintenance_banner', '""', 'string', 'Aviso global', 'Texto corto para comunicar cambios o mantenimiento. Vacío para ocultarlo.', 'Sistema', true)
ON CONFLICT (key) DO UPDATE SET
  type = EXCLUDED.type,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_public = EXCLUDED.is_public,
  updated_at = now();

CREATE TABLE IF NOT EXISTS ai_document_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  source ai_embedding_source NOT NULL,
  source_id uuid NOT NULL,
  content text NOT NULL,
  content_hash varchar(64) NOT NULL,
  metadata json DEFAULT '{}'::json NOT NULL,
  embedding extensions.vector(1536) NOT NULL,
  embedded_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_doc_embeddings_global_source_uniq
  ON ai_document_embeddings (source, source_id)
  WHERE owner_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ai_doc_embeddings_owner_source_uniq
  ON ai_document_embeddings (owner_id, source, source_id)
  WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_doc_embeddings_owner_source_idx
  ON ai_document_embeddings (owner_id, source);
CREATE INDEX IF NOT EXISTS ai_doc_embeddings_source_id_idx
  ON ai_document_embeddings (source, source_id);
CREATE INDEX IF NOT EXISTS ai_doc_embeddings_hash_idx
  ON ai_document_embeddings (content_hash);
CREATE INDEX IF NOT EXISTS ai_doc_embeddings_embedding_hnsw_idx
  ON ai_document_embeddings
  USING hnsw (embedding extensions.vector_cosine_ops);

CREATE OR REPLACE FUNCTION match_ai_documents(
  query_embedding extensions.vector(1536),
  match_count int DEFAULT 8,
  match_threshold double precision DEFAULT 0.78,
  source_filter ai_embedding_source DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  source ai_embedding_source,
  source_id uuid,
  owner_id uuid,
  content text,
  metadata json,
  similarity double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    d.id,
    d.source,
    d.source_id,
    d.owner_id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM ai_document_embeddings d
  WHERE (source_filter IS NULL OR d.source = source_filter)
    AND (1 - (d.embedding <=> query_embedding)) >= match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1)
$$;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_document_embeddings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE app_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE app_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ai_document_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION match_ai_documents(extensions.vector, integer, double precision, ai_embedding_source) TO authenticated;

DROP POLICY IF EXISTS "app_settings_public_read" ON app_settings;
DROP POLICY IF EXISTS "app_settings_admin_write" ON app_settings;
CREATE POLICY "app_settings_public_read" ON app_settings
  FOR SELECT USING (
    is_public = true
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );
CREATE POLICY "app_settings_admin_write" ON app_settings
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

DROP POLICY IF EXISTS "ai_document_embeddings_read" ON ai_document_embeddings;
DROP POLICY IF EXISTS "ai_document_embeddings_owner_insert" ON ai_document_embeddings;
DROP POLICY IF EXISTS "ai_document_embeddings_owner_update" ON ai_document_embeddings;
DROP POLICY IF EXISTS "ai_document_embeddings_owner_delete" ON ai_document_embeddings;
CREATE POLICY "ai_document_embeddings_read" ON ai_document_embeddings
  FOR SELECT USING (owner_id IS NULL OR owner_id = auth.uid());
CREATE POLICY "ai_document_embeddings_owner_insert" ON ai_document_embeddings
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "ai_document_embeddings_owner_update" ON ai_document_embeddings
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "ai_document_embeddings_owner_delete" ON ai_document_embeddings
  FOR DELETE USING (owner_id = auth.uid());
