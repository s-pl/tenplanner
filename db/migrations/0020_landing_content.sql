-- Landing content key-value store for admin-editable copy
CREATE TABLE IF NOT EXISTS landing_content (
  key varchar(80) PRIMARY KEY,
  value jsonb NOT NULL,
  type varchar(20) NOT NULL DEFAULT 'string', -- 'string' | 'string[]' | 'object[]'
  label varchar(200),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Seed default copy from existing hardcoded values
INSERT INTO landing_content (key, value, type, label) VALUES
  ('hero_title',         '"Diseña la sesión mientras piensas en el próximo partido."', 'string', 'Hero — Titular'),
  ('hero_subtitle',      '"TenPlanner es el cuaderno digital del entrenador de pádel profesional: biblioteca de drills, historial por alumno, curva de intensidad por sesión y un asistente — Dr. Planner — que conoce tu plantilla."', 'string', 'Hero — Subtítulo'),
  ('hero_cta_primary',   '"Empezar"', 'string', 'Hero — CTA primario'),
  ('hero_cta_secondary', '"Ver cómo funciona"', 'string', 'Hero — CTA secundario'),
  ('specs_strip', '[{"k":"Usado por","v":"Entrenadores","sub":"Club · Academia · Pro"},{"k":"Diseñar sesión","v":"≈ 3 min","sub":"vs. 20 min en papel"},{"k":"Drills incluidos","v":"137","sub":"+ los tuyos propios"},{"k":"IA razonando","v":"Claude 4.5","sub":"Pensamiento visible"}]', 'object[]', 'Banda de estadísticas (4 items)'),
  ('planner_heading',    '"Un asistente que piensa antes de proponer."', 'string', 'Dr. Planner — Titular'),
  ('planner_description','"Dr. Planner no es un formulario. Es un agente que lee el perfil de tu alumno, analiza su historial y razona en voz alta antes de sugerirte ejercicios y configurar la sesión."', 'string', 'Dr. Planner — Descripción'),
  ('biblioteca_heading', '"Tu biblioteca de ejercicios de pádel."', 'string', 'Biblioteca — Titular'),
  ('biblioteca_description', '"Más de 137 drills organizados por categoría, dificultad y fase de sesión. Crea los tuyos, marca favoritos y agrúpalos en listas."', 'string', 'Biblioteca — Descripción'),
  ('anatomia_heading',   '"Anatomía de una sesión perfecta."', 'string', 'Anatomía — Titular'),
  ('anatomia_description', '"Diseña por fases. Cada ejercicio lleva su intensidad. La curva de carga se dibuja sola y te dice si la sesión está desequilibrada."', 'string', 'Anatomía — Descripción'),
  ('alumnos_heading',    '"Cada alumno, su propio plan."', 'string', 'Alumnos — Titular'),
  ('alumnos_description', '"Ficha por alumno con nivel, historial y notas. Dr. Planner lo consulta automáticamente para ajustar la carga y los objetivos."', 'string', 'Alumnos — Descripción'),
  ('manifesto_heading',  '"Un entrenador con método gana más que un entrenador con talento."', 'string', 'Manifiesto — Titular'),
  ('manifesto_sub',      '"TenPlanner te da el sistema."', 'string', 'Manifiesto — Subtítulo'),
  ('footer_tagline',     '"Cuaderno digital del entrenador de pádel. Hecho para la pista, no para la demo."', 'string', 'Footer — Tagline')
ON CONFLICT (key) DO NOTHING;
