# Ten Planner — Informe de mejoras para implementación

**Fecha:** 11 de noviembre de 2026
**Destinatario:** Claude Code, trabajando sobre el repositorio de Ten Planner
**Origen:** análisis comparativo con *Tenis a fondo Entrena* (entrena.tenisafondo.com) + inspección del esquema real de producción en Supabase

---

## 0. Cómo usar este documento

Este informe es la especificación de trabajo. Está pensado para ejecutarse por fases, una por rama/PR, en el orden indicado en la sección 4.

Reglas de ejecución:

1. **Verifica antes de asumir.** El estado de la base de datos de la sección 2 está comprobado contra producción a fecha de hoy. El estado del *frontend* no: antes de cada fase, localiza en el repo los módulos implicados y confirma nombres de rutas, componentes y tipos reales. Si algo de este documento contradice al código, manda el código y anótalo.
2. **Una fase = un PR.** No mezcles fases. Cada fase incluye sus criterios de aceptación; no la des por cerrada sin cumplirlos.
3. **Nada de rehacer lo que ya existe.** La sección 2 lista explícitamente lo que ya está construido. El error más caro aquí sería duplicar estructuras (por ejemplo, crear un sistema de objetivos nuevo cuando ya hay 444 objetivos y 224 asignaciones).
4. **Migraciones:** usa `apply_migration` (no `execute_sql`) y una migración por fase, con nombre descriptivo. Toda tabla nueva nace con RLS activado y sus políticas en la misma migración.
5. **Vocabularios cerrados:** usa los valores que ya están en la base (sección 2.3). No inventes etiquetas nuevas ni traduzcas las existentes.
6. Si una decisión de producto no está resuelta en este documento, **pregunta antes de implementar**; no la resuelvas por defecto.

---

## 1. Contexto: por qué estas mejoras

El benchmark es *Tenis a fondo Entrena*, un producto mucho más estrecho que Ten Planner (solo tenis, solo monitor individual, sin capa de club) pero que gana en una cosa decisiva: **el monitor no construye la clase, la recibe ya montada y solo la retoca.** Su promesa es literal: "Monta la sesión en un minuto".

Ten Planner hoy es una herramienta de *construcción*: biblioteca, filtros, favoritos, crear desde cero, reutilizar. Es más potente y tiene toda la capa de gestión de club que Entrena no tiene (monitores, asistencia, informes a familias, avisos, estadísticas), pero el tiempo hasta el valor es alto: el monitor tiene que trabajar para obtener su clase.

**Tesis de producto de este informe:** no competir con Entrena en precio ni en estrechez, sino **copiar su motor y montarlo encima de lo que Ten Planner ya tiene y ellos no**. La combinación —sesión generada automáticamente + niveles por alumno + gestión de club e informes a familias— no la ofrece hoy ninguno de los dos.

Las tres piezas del motor de Entrena, en orden de importancia:

1. **Generación automática de la sesión** a partir de grupo, asistencia del día, duración, intensidad y foco, con edición posterior (±minutos, más fácil/más difícil, cambiar, fijar, reordenar).
2. **Escalera de nivel por golpe y por alumno** ("peldaños"), que hace que el grupo entrene al nivel de la mayoría y que quien está por encima o por debajo reciba **variantes nominales dentro del mismo ejercicio**.
3. **Bucle cerrado de feedback**: al acabar, un toque por ejercicio (Fácil / Justo / Difícil); dos "fácil" seguidos en un golpe suben peldaño, dos "difícil" lo bajan; la siguiente sesión ya sale ajustada.

Lo valioso es que **Ten Planner ya tiene casi todos los datos necesarios** para las tres. Lo que falta es, sobre todo, el motor y la capa de nivel por alumno.

---

## 2. Estado verificado de la base de datos

### 2.1 Proyectos Supabase

| Proyecto | Ref | Región | Creado | Estado |
|---|---|---|---|---|
| **tenplanner** (producción) | `pitsasnwfilyyipkhhim` | eu-north-1 | 13/04/2026 | Datos reales. **Trabaja contra este.** |
| Ten Planner | `xiqppjupqrfpdbdcrtzs` | eu-west-1 | 29/10/2026 | Clon/entorno secundario, datos de prueba |

> ⚠️ **Hallazgo de seguridad.** En el proyecto secundario `xiqppjupqrfpdbdcrtzs` hay **15 tablas con Row Level Security desactivado**: `places`, `classes`, `class_blocks`, `class_block_exercises`, `class_favorites`, `class_drafts`, `session_blocks`, `session_block_items`, `class_lists`, `class_list_items`, `session_lists`, `session_list_items`, `calendar_events`, `resources`, `dev_tasks`. Con la clave anónima, cualquiera puede leer y escribir todas sus filas. En producción esas mismas tablas **sí** tienen RLS. Antes de tocar nada, decide qué es ese proyecto: si es un entorno vivo, hay que activar RLS **con políticas** (activarlo a secas corta todo el acceso); si es un clon desechable, bórralo. Ver F0.

### 2.2 Qué existe ya (no rehacer)

**Contenido**

- `exercises` — **1.745 ejercicios**, 1.730 globales, **100 % tenis, 0 de pádel**. Metadatos por ejercicio: `niveles`, `aspectos_juego`, `golpes`, `fases`, `caracter`, `parametros`, `situacion_juego`, `tipo_pelota`, `tipo_actividad`, `formato`, `num_jugadores`, `intensity`, `duration_minutes`, `duracion_rango`, `steps`, `materials`, `tips`, `variantes`, `observaciones`, `image_urls`, `animation`, `autoria`, `club_id`.
  Cobertura real (importa mucho para el motor): `niveles` 1.724 (99 %), `fases` 1.649 (94 %), `steps` 1.427 (82 %), **`golpes` 980 (56 %)**, **`variantes` 730 (42 %)**, `tips` 668 (38 %), imagen ~198 (11 %).
- `classes` + `class_blocks` + `class_block_exercises` — **266 / 787 / 2.349**. Biblioteca de clases con estructura de bloques ordenados.
- `exercise_lists` / `exercise_list_items` (21 / 455), `class_lists` / `class_list_items` (13 / 238), `class_favorites`, `exercise_ratings` (6).

**Sesión real**

- `sessions` (34) — ya incluye `group_id`, `place_id`, `coach_id`, `status` (`scheduled|completed|cancelled`), `source_class_id`, y una capa de valoración que **ya está construida**: `coach_rating`, `session_rating`, `plan_followed`, `plan_change_reason`, `coach_comment`, `coach_audio_path`, `coach_audio_seconds`, `observations`.
- `session_blocks` (72) + `session_block_items` (135).
- `session_students` (85) — **`attended`, `rating`, `feedback`, `feedback_at`**. Ya hay feedback por alumno y sesión.

**Personas y club**

- `students` (55) — `player_level`, `birth_date`, `dominant_hand`, `notes`, `joined_at` / `left_at` / `left_reason`, `consent_given_at`, `consent_version`, `profile_token`, `club_id`, `locality`.
- `groups` (13) con `weekly_schedule jsonb` y `objetivos`; `group_students` (36); `group_coaches` (1); `student_coaches`; `student_guardians` (2).
- `clubs` (2), `club_members` (3, rol `owner|coach`), `club_invites`, `club_coach_profiles`.
- `announcements` (6) + `announcement_reads` / `announcement_replies`; `report_templates` (1, con `metrics jsonb`); `court_bookings` (5); `places` (11); `calendar_events`, `calendar_holidays`.

**Progreso**

- `tennis_objectives` — **444 objetivos activos**, estructurados por `aspect` × `stage` × `block` × `age_range` × `ball`, con `criterion`, `code`, `sort_order`, `is_final`.
- `student_objectives` — **224 asignaciones** con `achieved`, `achieved_at`, `marked_by`, `notes`.
- `objective_overrides` (2).

**Otros:** `dr_planner_chats` / `dr_planner_messages` (asistente), `ai_usage_events`, `ai_user_restrictions`, `ai_document_embeddings`, `admin_audit_logs`, `app_settings` (23), `landing_content` (17), `dev_tasks`.

### 2.3 Vocabularios existentes (usar literalmente)

- **Escalera de niveles** (`exercises.niveles`, orden real de progresión):
  `familiarizacion` → `descubrimiento` → `desarrollo` → `consolidacion` → `especializacion` → `precompeticion` → `competicion` → `rendimiento`
  Vía paralela de adultos: `adultos_iniciacion`, `adultos_medio_alto`.
  Reparto actual: descubrimiento 402, desarrollo 374, consolidación 370, especialización 269, precompetición 248, competición 235, rendimiento 218, familiarización 10, adultos 3+3.
- **Golpes** (`exercises.golpes`): `derecha` (597), `reves` (594), `saque` (250), `volea` (189), `resto` (108), `remate` (67), `globo` (55), `dejada` (27).
- **Aspectos** (`exercises.aspectos_juego`): `tecnica` (845), `tactica` (488), `fisico` (379), `mental` (254).
- **Fases** (enum `training_phase`): `activation` (339) | `main` (1.168) | `cooldown` (145).
- **Carácter**: `competitivo` (748) | `reto` (430) | `cooperativo` (371).
- **Parámetros**: `direccion`, `profundidad`, `altura`, `velocidad`. **Situación**: `ataque`, `defensa`, `neutra`.
- **Enums de Postgres**: `sport` (`tenis|padel|pickleball|tenis_playa`), `difficulty` (`beginner|intermediate|advanced`), `exercise_category` (`technique|tactics|fitness|warm-up|trucos-tecnicos`), `tipo_pelota` (`normal|lenta|rapida|sin_pelota|gomaespuma|roja|naranja|verde|amarilla`), `tipo_actividad` (`tecnico_tactico|fisico|cognitivo|competitivo|ludico`), `ejercicio_formato` (`individual|parejas|grupal|multigrupo`), `session_status`, `club_member_role`, `club_member_status`, `announcement_audience`.

### 2.4 Deuda técnica relevante para estas fases

1. **`students.player_level` está sucio.** 23 de 55 alumnos a `null`, y el resto mezcla dos vocabularios: los niveles nuevos (`consolidacion`, `descubrimiento`, `competicion`, `especializacion`, `precompeticion`, `desarrollo`, `adultos_*`) con restos del enum `difficulty` (`intermediate`, `advanced`). Hay que normalizar (F0).
2. **Dos estructuras paralelas de bloques**: `class_blocks`/`class_block_exercises` (biblioteca, muy poblada) y `session_blocks`/`session_block_items` (sesión, poco poblada). Antes de F1, determina cuál es la canónica en el código actual y si la sesión se materializa desde la clase o la referencia. **Este informe asume que la sesión generada se materializa en `sessions` + `session_blocks` + `session_block_items`**, dejando la biblioteca intacta; confírmalo.
3. **44 % de ejercicios sin `golpes`** y 58 % sin `variantes`. El motor debe degradar con elegancia (sección F1.4 y F3.3), no fallar.
4. **Cero contenido de pádel** pese a que el producto se vende como multideporte. No es objeto de estas fases, pero condiciona el mensaje comercial.
5. Tablas de respaldo en producción (`backup_exercises_tags_20261111`, `backup_exercises_objectives_20261109`, `backup_classes_objetivos_20261109`) — limpiar cuando toque.

---

## 3. Principio rector

> **El monitor abre la app y ya tiene la clase de hoy delante. Todo lo demás es ajuste.**

Tres corolarios que gobiernan cada decisión de esta especificación:

- **Proponer, no preguntar.** Cuando falte un dato (nivel de un alumno, foco de la sesión), el sistema elige un valor razonable, lo aplica y lo dice en una línea. Nunca bloquea con un formulario.
- **Todo lo generado es editable y nada es mágico.** Cada decisión del motor se explica en texto plano, al estilo de Entrena ("Automático: Revés (peldaño 1) y Saque (peldaño 1), lo que está más abajo en su escalera").
- **El uso diario genera los datos.** El feedback de un toque al final de la clase es lo que alimenta niveles, progreso e informes a familias. Si pedir el dato cuesta más de un segundo, no se pide.

---

## 4. Roadmap

| Fase | Entrega | Depende de | Esfuerzo | Impacto |
|---|---|---|---|---|
| **F0** | Higiene: RLS, normalización de niveles, escalera canónica | — | S | Habilitante |
| **F1** | **Motor "Monta la clase en 1 minuto"** | F0 | **L** | **Máximo** |
| **F2** | Peldaños por alumno + feedback de un toque | F0, F1 | M | Muy alto |
| **F3** | Variantes nominales por alumno dentro del ejercicio | F2 | M | Alto |
| **F4** | Exportar a WhatsApp + hoja imprimible | F1 | **S** | Alto / coste bajo |
| **F5** | Bloque de 4 semanas autogenerado | F1, F2 | M | Medio-alto |
| **F6** | Informe a familias alimentado por peldaños | F2 | M | Alto (venta a clubes) |
| **F7** | Onboarding con datos de ejemplo + molestias | F1 | S | Medio |
| **F8** | Comunidad: "aporta un ejercicio" con puntos | — | M | Medio (contenido) |
| **F9** | Precio y empaquetado público | — | S | Decisión de producto |

**Si solo se hacen tres cosas: F1, F2 y F4.** Son las que cambian la experiencia del monitor de "construir" a "recibir".

---

## F0 — Higiene y cimientos

**Objetivo:** dejar el terreno listo para que el motor pueda confiar en los datos.

### F0.1 Resolver el proyecto Supabase secundario

Decide con David qué es `xiqppjupqrfpdbdcrtzs`. Si se queda, activar RLS **con políticas equivalentes a las de producción** en las 15 tablas listadas en 2.1. SQL de activación (no ejecutar sin las políticas detrás):

```sql
ALTER TABLE "public"."places" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_block_exercises" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_favorites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_drafts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_block_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_lists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_list_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_lists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_list_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."dev_tasks" ENABLE ROW LEVEL SECURITY;
```

Copia las políticas desde producción con `pg_policies` para no escribirlas a mano.

### F0.2 Escalera canónica de niveles

Crear la escalera como dato, no como constante repartida por el código:

```sql
create table public.skill_levels (
  code        text primary key,
  sport       public.sport not null default 'tenis',
  track       text not null default 'base',      -- 'base' | 'adultos'
  position    smallint not null,                 -- 1..8 en 'base'
  label_es    text not null,
  created_at  timestamptz not null default now()
);
-- base: familiarizacion(1) descubrimiento(2) desarrollo(3) consolidacion(4)
--       especializacion(5) precompeticion(6) competicion(7) rendimiento(8)
-- adultos: adultos_iniciacion(1) adultos_medio_alto(2)
```

Útil además una función `public.level_position(text) returns smallint` para comparar niveles en SQL sin repetir el `case`.

### F0.3 Normalizar `students.player_level`

- `intermediate` → `desarrollo`; `advanced` → `especializacion` (confirmar con David antes de aplicar).
- Los 23 nulos: dejar nulos. El motor los resuelve con la cascada de F2.2; no inventar un nivel en la migración.
- Añadir `check` contra `skill_levels.code` una vez limpio.

### Criterios de aceptación F0

- [ ] Decisión documentada sobre el proyecto secundario; si se conserva, `rls_disabled` deja de aparecer en los advisors.
- [ ] `skill_levels` poblada y usada por al menos un punto del código (sin constantes duplicadas).
- [ ] `select distinct player_level from students` solo devuelve códigos válidos o `null`.

---

## F1 — Motor "Monta la clase en 1 minuto"

**La fase central.** Todo lo demás se apoya aquí.

### F1.1 Experiencia

Pantalla de inicio del monitor (sustituye o precede al explorador actual):

```
HOY TOCA
Monta la clase en un minuto
Alevín B · martes y jueves · 8 alumnos

HOY VIENEN · 8 de 8     [Ane] [Jon] [Leire] [Unai] ...   ← toggles de asistencia
DURACIÓN                 30 · 45 · 60 · 90
INTENSIDAD               Suave · Media · Alta
FOCO                     Automático · Derecha · Revés · Saque · Resto · Volea · Remate · Táctica · Físico

ℹ Automático: Revés (desarrollo) y Saque (descubrimiento), lo más bajo de su escalera.

            [ MONTAR CLASE ]
```

Resultado: la clase completa, con barra de tiempo que suma exactamente la duración elegida, y por ejercicio: `−/+ minutos`, `Más fácil`, `Más difícil`, `Cambiar`, `Fijar`, `↑ ↓`, `✕`. Al pie: `Otra propuesta`, `Añadir ejercicio`, y (F4) `Hoja para imprimir`, `Copiar para WhatsApp`, `Anotar cómo fue`.

`Fijar` es importante: marca un ejercicio como inamovible para que `Otra propuesta` regenere el resto sin tocarlo.

### F1.2 Entradas del generador

```ts
type GenerateInput = {
  groupId: string;
  sport: Sport;                 // del grupo
  date: string;                 // ISO
  attendeeIds: string[];        // por defecto, todos los del grupo
  durationMinutes: 30|45|60|90;
  intensity: 'suave'|'media'|'alta';
  focus: 'auto' | Golpe | 'tactica' | 'fisico';
  pinned?: { slotIndex: number; exerciseId: string }[];
  seed?: string;                // reproducibilidad y "Otra propuesta"
};
```

### F1.3 Esqueleto de la sesión por duración

Plantilla de slots (minutos objetivo; el ajuste fino en F1.6):

| Duración | activation | main (técnica) | main (táctica/situación) | main (puntos, `caracter=competitivo`) | cooldown |
|---|---|---|---|---|---|
| 30 | 5 | 10 | — | 11 | 4 |
| 45 | 7 | 14 | 9 | 10 | 5 |
| 60 | 8 | 14 | 8 | 25 (dos slots: 10 + 15) | 5 |
| 90 | 12 | 20 | 15 | 35 (dos slots: 15 + 20) | 8 |

La intensidad no cambia el esqueleto: filtra por `exercises.intensity` (suave ≤ 2, media 2–4, alta ≥ 4; ajustar al rango real del campo) y desempata hacia `caracter` cooperativo (suave) o competitivo (alta).

### F1.4 Selección de candidatos por slot

Para cada slot, consulta sobre `exercises`:

```
sport = :sport
AND (is_global OR club_id = :clubId OR created_by = :userId)
AND fases @> [fase del slot]
AND niveles @> [nivel del grupo]            -- ver cascada abajo
AND (slot con golpe → golpes @> [golpe])
AND (slot de puntos → caracter @> ['competitivo'])
AND duration_minutes BETWEEN objetivo*0.6 AND objetivo*1.6
AND num_jugadores IS NULL OR num_jugadores <= :asistentes
```

**Cascada de relajación** (obligatoria, por la cobertura real de datos): si un slot devuelve menos de 3 candidatos, relaja en este orden y registra qué relajó para poder explicarlo en la UI:

1. nivel ±1 posición en la escalera
2. quitar el filtro de `golpes` (recuerda: 44 % de ejercicios no lo tienen)
3. ampliar la ventana de duración
4. nivel ±2
5. último recurso: cualquier ejercicio de la fase correcta

### F1.5 Puntuación

```
score =
  + 3.0  si niveles contiene exactamente el nivel del grupo
  + 2.0  si golpes contiene el foco
  + 1.5  si tiene steps (82 % lo tiene; sin pasos el monitor no lo puede dar)
  + 1.0  si tiene variantes            ← clave para F3
  + 0.8  si tiene imagen o animación
  + 0.5 × rating medio normalizado (exercise_ratings)
  − 4.0  si se usó en las últimas 3 sesiones del grupo
  − 2.0  si se usó en las últimas 8 sesiones del grupo
  − 1.5  si repite tipo_actividad del slot anterior
  − 1.0  si repite tipo_pelota del slot anterior
```

Selección por *softmax* sobre los 8 mejores con la `seed`, no `argmax`: así `Otra propuesta` da algo distinto sin caer en lo mediocre.

**Antirrepetición:** calcula el histórico desde `sessions` del grupo con `status='completed'` unidas a `session_block_items`. Si el volumen crece, materializa una vista `group_exercise_usage(group_id, exercise_id, last_used_at, times_used)`.

### F1.6 Ajuste de duración

La suma debe ser **exactamente** la duración pedida (Entrena lo muestra y da confianza). Reparte la diferencia proporcionalmente sobre los slots no fijados, respetando `duration_minutes ± 40 %` de cada ejercicio y redondeando a minutos enteros; el resto que sobre, al slot de puntos.

### F1.7 Persistencia

Materializa en `sessions` (`status='scheduled'`, `group_id`, `coach_id`, `place_id` si el grupo tiene sitio habitual) + `session_blocks` (uno por fase) + `session_block_items`. Guarda la traza de generación para poder depurar y explicar:

```sql
alter table public.sessions
  add column generated_by text,            -- 'auto_v1' | null
  add column generation_input jsonb,       -- GenerateInput
  add column generation_trace jsonb;       -- slot → candidatos, score, relajaciones
```

Botón secundario **"Guardar como clase de la biblioteca"** → crea `classes` + `class_blocks` + `class_block_exercises`. La biblioteca **no** se modifica nunca de forma automática.

### F1.8 Dónde vive el motor

Módulo puro y testeable, sin dependencias de React ni de red:

```
/lib/session-engine/
  index.ts          generateSession(input, repo) → SessionPlan
  skeleton.ts       plantillas por duración
  candidates.ts     consulta + cascada de relajación
  scoring.ts        puntuación y selección con seed
  fit.ts            ajuste de duraciones
  explain.ts        frases en castellano de cada decisión
  types.ts
```

El acceso a datos entra por un `repo` inyectado → tests con fixtures, sin Supabase.

### Criterios de aceptación F1

- [ ] Desde el panel, con un grupo existente, hay una clase completa en pantalla en **≤ 3 clics y < 2 s**.
- [ ] La suma de minutos es exactamente la duración elegida, siempre.
- [ ] `Otra propuesta` cambia al menos el 50 % de los ejercicios no fijados y respeta los fijados.
- [ ] Ningún ejercicio repetido respecto a las 3 últimas sesiones completadas del grupo (salvo que la cascada llegue al paso 5; en ese caso la UI lo advierte).
- [ ] Tests del motor con fixtures que cubren: grupo sin niveles, grupo con 2 asistentes, ejercicios sin `golpes`, duración 30 y 90.
- [ ] La sesión generada se guarda y se reabre idéntica.
- [ ] La biblioteca de clases queda sin modificar.

---

## F2 — Peldaños por alumno y feedback de un toque

**Objetivo:** que el motor sepa a qué nivel está cada alumno en cada golpe, y que ese dato se mantenga solo.

### F2.1 Modelo

```sql
create table public.student_skills (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students(id) on delete cascade,
  sport       public.sport not null default 'tenis',
  skill       text not null,          -- golpe ('derecha'...) o aspecto ('tactica','fisico')
  level_code  text not null references public.skill_levels(code),
  source      text not null default 'auto',  -- 'auto' | 'coach' | 'initial'
  updated_at  timestamptz not null default now(),
  unique (student_id, sport, skill)
);

create table public.session_exercise_feedback (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  item_id       uuid references public.session_block_items(id) on delete set null,
  exercise_id   uuid references public.exercises(id),
  student_id    uuid references public.students(id) on delete cascade, -- null = todo el grupo
  verdict       text not null check (verdict in ('facil','justo','dificil')),
  created_by    uuid,
  created_at    timestamptz not null default now()
);
```

RLS: el monitor ve y escribe lo de sus alumnos (vía `students.coach_id`, `group_coaches` o `club_members` del club del alumno). Replica el patrón de `student_objectives`.

### F2.2 Cascada para resolver el nivel de un alumno

1. `student_skills` para ese golpe.
2. `student_skills` del mismo aspecto (media de los golpes conocidos).
3. `students.player_level`.
4. Nivel del grupo (moda de los alumnos que sí tienen dato).
5. Por edad desde `birth_date`, cruzada con `tennis_objectives.age_range`.
6. `descubrimiento`.

Nunca bloquear pidiendo el dato. Si se usó el paso 4 o posterior, la ficha del alumno muestra un aviso discreto "nivel estimado" con un clic para fijarlo.

### F2.3 Nivel del grupo

**Moda** (no media) de los niveles de **los asistentes del día** para el golpe del foco; empate → el más bajo. Esto es exactamente lo que hace Entrena ("El nivel del grupo sale de la mayoría de los que vienen") y es lo que hace que la asistencia del día importe.

### F2.4 Regla de progresión

Al cerrar la sesión, por cada `(student_id, skill)`:

- **dos `facil` consecutivos** → sube una posición en la escalera
- **dos `dificil` consecutivos** → baja una posición
- `justo` **no rompe** la racha, la mantiene (decisión de producto: evita que una sesión intermedia borre la señal). Confirmar con David; Entrena no lo especifica.
- Tope en posiciones 1 y 8 del track correspondiente.
- Todo cambio automático escribe `source='auto'` y se registra en una tabla de eventos o en `notes`, para poder explicarlo y revertirlo.
- Un cambio manual del monitor (`source='coach'`) **congela el automático 3 sesiones** para ese skill.

La regla se implementa en el motor, no en un trigger de base de datos: así es testeable y se puede cambiar sin migración.

### F2.5 UI

- **Diálogo "Anotar cómo fue"** al terminar: lista de ejercicios de la sesión, cada uno con `Fácil | Justo | Difícil` a nivel de grupo, más un modo "por alumno" plegado para el monitor que quiera precisión. Campo de notas rápidas opcional que escribe en `session_students.feedback` (ya existe). Debe cerrarse en menos de 15 segundos.
- **Tabla "Quién está en cada peldaño"**: alumnos en filas, golpes en columnas, fila final con la moda del grupo, sombreado verde/rojo para quien está por encima/por debajo. Clic en un alumno → su escalera, sus notas y corrección manual.
- Alimenta también `student_objectives`: al subir de peldaño, proponer marcar como logrados los `tennis_objectives` del stage anterior para ese aspecto. **Proponer, no marcar solo.**

### Criterios de aceptación F2

- [ ] "Anotar cómo fue" se completa en < 15 s con 6 ejercicios.
- [ ] Dos sesiones seguidas marcando `facil` en revés suben el peldaño del alumno y **la siguiente sesión generada lo refleja** (test de integración).
- [ ] La tabla de peldaños carga en < 500 ms con 30 alumnos.
- [ ] Un cambio manual no es pisado por el automático en las 3 sesiones siguientes.
- [ ] RLS verificada: un monitor no ve peldaños de alumnos de otro club.

---

## F3 — Variantes nominales dentro del ejercicio

**Objetivo:** que el alumno que está por encima o por debajo del grupo reciba su ajuste **con su nombre**, dentro del mismo ejercicio. Es el detalle que más impresiona de Entrena y el que mejor se vende a un club.

### F3.1 Presentación

```
Reveses de calentamiento con cesta            Revés · desarrollo · Cesta
Calentar el revés con bolas lentas y bien colocadas.
  ▸ Más difícil — Maialen: bolas lanzadas a un paso de distancia.
  ▸ Más fácil  — Oier, Nora, Aitor: bolas a la altura del pecho, justo delante.
```

Agrupa a los alumnos por variante; no repitas la línea por alumno.

### F3.2 Origen del texto

1. `exercises.variantes` cuando existe (730 de 1.745). Hoy es texto libre: hay que parsearlo o, mejor, **migrar a estructura**:

```sql
alter table public.exercises
  add column variantes_struct jsonb;   -- { "mas_facil": ["..."], "mas_dificil": ["..."] }
```

Migración asistida: intentar parseo automático de los 730, dejar el resto para revisión manual en el panel de administración. No borrar `variantes` hasta que la estructura esté validada.

2. **Fallback determinista** cuando no hay texto (58 % de los casos). Genera la variante a partir de los metadatos del ejercicio con una tabla de modificadores:

| Eje | Más fácil | Más difícil |
|---|---|---|
| `tipo_pelota` | bajar un escalón (amarilla→verde→naranja→roja→gomaespuma) | subir un escalón |
| Distancia | acercar al jugador / media pista | alejar / fondo |
| Objetivo | zona ancha o sin zona | zona estrecha, conos, diana |
| Continuidad | bola lanzada a mano o con cesta | bola en juego, peloteo |
| Oposición | sin oposición, cooperativo | con oposición, puntuando |
| Repeticiones | menos bolas, sin contar | series más largas, contar seguidas |

Elige el eje por `parametros` y `tipo_actividad` del ejercicio. El texto resultante es corto, en imperativo y en castellano.

3. **Nunca inventar con IA en tiempo de generación**: lento, caro y no reproducible. Si se usa IA, que sea en lote para rellenar `variantes_struct` y con revisión humana.

### F3.3 Asignación

Para cada ejercicio con golpe conocido, compara el peldaño de cada asistente con el nivel del grupo: por encima → `mas_dificil`, por debajo → `mas_facil`, igual → nada. Si el ejercicio no tiene golpe, usa el aspecto. Si no hay dato, no muestres variantes (mejor nada que ruido).

### Criterios de aceptación F3

- [ ] Con un grupo donde haya alumnos por encima y por debajo, toda la sesión generada muestra variantes nominales coherentes.
- [ ] Ningún ejercicio muestra una variante vacía o un texto genérico sin sentido.
- [ ] El fallback cubre el 100 % de los ejercicios sin `variantes`.
- [ ] Las variantes salen en la hoja imprimible y en el texto de WhatsApp (F4).

---

## F4 — Exportar: WhatsApp y hoja imprimible

**La mejor relación impacto/coste de todo el informe.** Dos botones al pie de la sesión.

### F4.1 "Copiar para WhatsApp"

Texto plano al portapapeles, sin markdown (WhatsApp no lo renderiza bien), con emojis mínimos y el nombre del monitor o del club:

```
🎾 Alevín B · jueves 13/11 · 18:00–19:00

1. Calentamiento (8') — Reveses con cesta
2. Técnica (14') — Revés con bola lanzada
3. Táctica (8') — Mini-pista: ¿dónde me conviene?
4. Puntos (10') — Puntos de cinco bolas
5. Juego (15') — Rey de la pista
6. Vuelta a la calma (5')

Material: cesta, conos, pelotas naranjas
— Club de Tenis X
```

Variante "para familias" (sin detalle técnico) y variante "para monitor" (con pasos y variantes). Usa `navigator.clipboard` con *fallback*, y confirma con un *toast*.

### F4.2 "Hoja para imprimir"

Vista `/sesion/[id]/imprimir` optimizada a **una cara de A4**, en blanco y negro, legible a un metro: cabecera con grupo/fecha/duración, tabla de bloques con minutos acumulados, pasos resumidos, variantes por alumno, casillas de asistencia y una columna en blanco para anotar a mano. `@media print` con `@page { size: A4; margin: 12mm }`, sin fondos de color ni sombras.

Reutiliza esta vista para generar el PDF adjunto de los informes a familias (F6).

### Criterios de aceptación F4

- [ ] El texto de WhatsApp pegado en móvil se lee bien, sin asteriscos ni guiones sueltos.
- [ ] La hoja entra en **una** página A4 con 6 ejercicios y 8 alumnos.
- [ ] Imprime correctamente desde Chrome y Safari, en escritorio y en iOS.
- [ ] Las variantes nominales aparecen en ambos formatos.

---

## F5 — Bloque de 4 semanas

**Objetivo:** dar el plan del mes, no solo la sesión del día.

Entrada: grupo, sesiones por semana (1–4), duración, foco del bloque (o automático). Salida: 4 semanas con sus sesiones, cada una generable y editable.

Periodización, explicada en una línea en la propia UI (copiando la claridad de Entrena): *"Foco en 2 de cada 3 sesiones; la última semana, más suave, para consolidar y medir."*

- Semana 1 — introducir el foco (intensidad media, más `tecnica`)
- Semana 2 — desarrollar (media/alta, `tecnica` + `tactica`)
- Semana 3 — más ritmo (alta, `tactica` + `competitivo`)
- Semana 4 — consolidar y medir (suave, repaso + situaciones de evaluación que alimentan F2 y F6)

Modelo: `training_blocks` (group_id, start_date, weeks, sessions_per_week, focus, generated_by) + relación con las `sessions` creadas en estado `scheduled`. Respetar `calendar_holidays` y `groups.weekly_schedule` al proponer fechas.

Las sesiones se generan **en diferido**: el bloque guarda la intención (semana, foco, intensidad) y cada sesión se materializa al abrirla o 48 h antes, para que use los peldaños más recientes.

### Criterios de aceptación F5

- [ ] Un bloque de 4 semanas × 2 sesiones se crea en < 5 s y respeta el horario semanal del grupo y los festivos.
- [ ] Las sesiones del bloque aparecen en el calendario como programadas.
- [ ] Regenerar una sesión del bloque no altera las demás.

---

## F6 — Informe a familias alimentado por peldaños

**Aquí es donde Ten Planner supera a Entrena**, porque Entrena no tiene ni familias ni club.

Combina lo que ya existe (`report_templates.metrics`, `student_objectives`, `session_students.attended`, `announcements`, `student_guardians`) con lo nuevo (`student_skills`, `session_exercise_feedback`).

Contenido del informe por alumno y periodo: asistencia (ya calculable), **escalera por golpe con el movimiento del periodo** ("Revés: desarrollo → consolidación"), objetivos logrados desde `student_objectives`, 2–3 notas del monitor seleccionadas de `session_students.feedback`, y una recomendación corta. **Sin datos sensibles**: nada de salud, ni comparaciones entre alumnos.

Generación en lote por grupo, previsualización, edición del texto por el monitor antes de enviar, y envío por el canal que ya existe (`announcements` con `audience='student'`) y/o PDF descargable desde la vista de impresión de F4.

> **Envío a familias: siempre con confirmación explícita del monitor.** Nunca automático.

### Criterios de aceptación F6

- [ ] Informe de un grupo de 8 alumnos generado en < 10 s, editable antes de enviar.
- [ ] Un alumno sin datos de peldaños produce un informe válido (asistencia + notas), no un error.
- [ ] Ningún informe se envía sin acción explícita del monitor.
- [ ] El PDF es legible y cabe en 1–2 páginas.

---

## F7 — Onboarding con datos de ejemplo y molestias

### F7.1 Datos de ejemplo borrables

Al registrarse, sembrar un club de prueba, un grupo, 6–8 alumnos de ejemplo y un par de clases, marcados con una bandera y **borrables de una vez** desde el panel. Entrena lo hace bien: *"Te hemos dejado grupos y jugadores de ejemplo para que pruebes. Cuando quieras empezar con los tuyos, bórralos todos de una vez."*

```sql
alter table public.students add column is_sample boolean not null default false;
alter table public.groups   add column is_sample boolean not null default false;
-- idem classes/sessions sembradas
```

Un único endpoint `DELETE /api/onboarding/sample-data` que limpia en cascada, con confirmación.

### F7.2 Molestias y lesiones

Campo por alumno que **excluye ejercicios del grupo**, como hace Entrena (hombro, codo o muñeca, espalda, rodilla, tobillo):

```sql
alter table public.students add column limitaciones jsonb not null default '[]';
```

> ⚠️ **Tratar como dato sensible.** Son etiquetas funcionales de carga, **no** diagnósticos médicos: nada de texto libre clínico, nada de historial. Etiqueta cerrada, visible solo para el monitor del alumno, excluida de informes a familias y de cualquier exportación. Revisar con el aviso de privacidad y el consentimiento ya existente (`students.consent_given_at`, `consent_version`) antes de publicar.

El motor filtra los ejercicios incompatibles con las limitaciones de los asistentes y lo dice: *"Se han evitado 3 ejercicios de saque por las limitaciones de Unai."*

### F7.3 Privacidad de menores

Entrena es explícito: *"Solo alias y año: nada de email, fotos ni datos médicos. Con menores de 14, el alta la hace el entrenador o la familia."* Ten Planner permite hoy `email`, `phone`, `image_url` y `birth_date` completa. Revisar: para menores, por defecto alias + año de nacimiento, foto desactivada, y el contacto en `student_guardians`, no en el alumno. Es, además, un argumento de venta ante clubes y familias.

### Criterios de aceptación F7

- [ ] Una cuenta nueva puede montar su primera sesión sin crear ningún dato.
- [ ] "Borrar los ejemplos" deja la cuenta limpia sin tocar datos reales.
- [ ] Un alumno con limitación de hombro excluye los ejercicios de saque/remate del grupo y se explica en la UI.
- [ ] Las limitaciones no aparecen en ningún informe ni exportación a familias.

---

## F8 — Comunidad: "aporta un ejercicio"

El mecanismo de Entrena: el monitor propone un ejercicio; si entra en la app, **sale con su nombre** y sus puntos se descuentan de la siguiente cuota. Resuelve el contenido (incluido el de pádel, hoy inexistente), retiene y da orgullo de autor.

Aprovecha lo existente: `exercise_drafts` (13 filas) y `exercises.autoria`.

- `exercise_contributions` (user_id, exercise_draft_id, status `pendiente|aceptado|rechazado`, points, reviewed_by, reviewed_at)
- `user_credits` (user_id, points, euros equivalentes, movimientos)
- Panel de revisión para el administrador, reutilizando `admin_audit_logs`.
- Formulario de aporte guiado por la ficha estándar: nombre, objetivo, pasos, material, clave, error típico, variante fácil y difícil, dibujo o foto opcional. **Exige `golpes`, `niveles`, `fases` y `variantes`**, que es justo donde hay huecos hoy.

### Criterios de aceptación F8

- [ ] Un monitor puede enviar un ejercicio y ver su estado.
- [ ] Un ejercicio aceptado aparece en la biblioteca con la autoría visible y suma puntos.
- [ ] El administrador revisa y acepta/rechaza con motivo, y queda traza.

---

## F9 — Precio y empaquetado (decisión de producto, no código)

Contraste actual:

| | Ten Planner | Tenis a fondo Entrena |
|---|---|---|
| Monitor individual | 20 €/mes ≈ **240 €/año** | **50 €/año** (32,50 € el primer año) |
| Club | 50 €/mes + 10 €/monitor ≈ **600 €/año** + monitores | **90 €/año** (58,50 € el primer año) |
| Precios en la web | **No visibles** | Visibles, con prueba de un mes sin tarjeta |
| Alcance | Multideporte + gestión de club | Solo tenis, monitor individual |

Dos cosas que conviene mover ya, independientemente del desarrollo:

1. **Publicar los precios en tenplanner.com.** Su ausencia frena registros y obliga al visitante a dar el paso a ciegas.
2. **Plan anual para el monitor individual** a un precio comparable al del mercado (orden de 60–90 €/año), manteniendo el mensual por monitor y el plan de club donde el valor es la gestión, los informes y la multiusuario. El club paga por lo que Entrena no puede ofrecer; el monitor suelto no puede pagar 5× por lo mismo.

No es trabajo de Claude Code: es una decisión de David. Se incluye porque condiciona el retorno de todo lo anterior.

---

## 5. Guardarraíles

- **Multideporte.** Todo lo nuevo lleva `sport`. Si la escalera de niveles de pádel difiere, parametrízala en `skill_levels` desde el principio: no claves fijas de tenis en el código.
- **Club.** Todo lo nuevo lleva `club_id` cuando aplica, y RLS coherente con `club_members`. Un monitor nunca ve datos de otro club.
- **RLS siempre.** Tabla nueva = `enable row level security` + políticas en la misma migración. Cero excepciones.
- **Castellano.** Toda cadena visible al usuario en castellano, en archivos de texto, no incrustada en componentes: el producto acabará necesitando euskera o inglés.
- **El motor es puro.** Sin llamadas de red ni de IA dentro de la generación. Determinista con `seed`.
- **Nada destructivo automático.** Ni borrar, ni enviar a familias, ni modificar la biblioteca sin acción explícita del monitor.
- **Compatibilidad hacia atrás.** Las 266 clases y 34 sesiones existentes deben seguir abriéndose igual después de cada fase.
- **Rendimiento.** La generación es una consulta por slot como máximo; si hace falta, índices GIN sobre `exercises(niveles)`, `(golpes)`, `(fases)`, `(caracter)`.

---

## 6. Métricas para saber si funcionó

| Métrica | Antes | Objetivo |
|---|---|---|
| Tiempo desde abrir la app hasta tener la clase | minutos | **< 60 s** |
| Sesiones creadas con el motor sobre el total | 0 % | > 70 % |
| Sesiones con "Anotar cómo fue" completado | n/d | > 50 % |
| Alumnos con al menos 3 peldaños informados | 0 | > 80 % de los activos |
| Monitores que exportan a WhatsApp o imprimen | 0 | > 40 % semanal |
| Retención del monitor a 8 semanas | n/d | medir desde el día uno |

Instrumenta `generated_by` en `sessions` y un evento por exportación; no hace falta más al principio.

---

## 7. Prompt inicial para Claude Code

> Trabaja sobre el repositorio de Ten Planner. Lee `tenplanner-mejoras-spec.md` entero antes de escribir nada.
>
> Empieza por una **auditoría de la fase F1**: localiza en el código el flujo actual de creación de clases y sesiones, dime qué estructura es la canónica (`class_blocks` o `session_blocks`), dónde vive el acceso a `exercises`, cómo se resuelven grupos y asistencia, y qué partes de este informe no encajan con el código real.
>
> No escribas código ni migraciones todavía. Devuélveme la auditoría y un plan de F1 en pasos verificables, señalando las decisiones que necesitan respuesta mía.
>
> Base de datos: proyecto Supabase `pitsasnwfilyyipkhhim` (producción). Cualquier migración, con `apply_migration` y revisada conmigo antes de aplicarla.

---

## Anexo — Resumen del benchmark

Lo que hace *Tenis a fondo Entrena* y conviene tener presente:

- Secciones: Sesión, Plan, Ejercicios, Niveles, Panel. Cinco, ni una más.
- Sesión generada con barra de tiempo y controles por ejercicio (±min, más fácil, más difícil, cambiar, fijar, mover, quitar).
- Ficha de ejercicio de estructura fija: dibujo de pista, pasos numerados, clave, meta, versión fácil, material, peldaño.
- Biblioteca de 235 fichas (150 en la demo), filtrable por tipo y golpe. Cerrada y curada: el usuario no crea ejercicios, los **propone**.
- Tabla de peldaños por jugador y golpe, con fila de "mayoría" y sombreado de quien va por encima o por debajo.
- Plan de 4 semanas con periodización explicada en una frase.
- "Hoja para imprimir", "Copiar para WhatsApp", "Anotar cómo fue".
- Ficha de jugador: alias, año, mano, grupos, molestias, peldaño por golpe. Sin email, fotos ni datos médicos.
- Datos de ejemplo precargados y borrables de una vez.
- 50 €/año y 90 €/año, mes gratis sin tarjeta, −35 % el primer año.
- Programa de aportación de ejercicios con autoría y descuento en la cuota.
- Detrás, una web que vende 300 fichas en PDF (pack 39 €), regala 3 a cambio de email y publica ejercicios gratis para captar tráfico.

Lo que **no** tiene y Ten Planner sí: varios monitores, club, asistencia con historial, informes a familias, avisos y mensajes, reservas de pista, calendario común, estadísticas, ejercicios propios del usuario, multideporte.
