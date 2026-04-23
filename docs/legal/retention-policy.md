# Política de retención de datos

Cada tabla tiene un plazo de conservación justificado y un mecanismo de purga. El cron `/api/cron/cleanup` se ejecuta diariamente (configurado en `vercel.json`).

**Última revisión:** 2026-04-23

| Tabla / dato | Plazo | Mecanismo | Justificación |
| --- | --- | --- | --- |
| `users` | Mientras la cuenta esté activa. | Borrado al ejecutar `/api/account/delete`. | Base contractual. |
| `sessions`, `session_exercises`, `session_students` | Mientras la cuenta del entrenador esté activa. | Cascade `onDelete` vinculado a `users.id`. | Parte del servicio. |
| `students` | Mientras el entrenador mantenga la ficha. | Borrado manual por el entrenador o cascada desde `users`. | Interés legítimo del entrenador. |
| `students.profile_token` | 7 días desde generación. | `cron/cleanup` pone `NULL` cuando `profile_token_expires_at < now()`. | Mínimo necesario para el onboarding. |
| `exercises` creados por el usuario | Mientras la cuenta del entrenador esté activa. | Cascada `onDelete` desde `users` (SET NULL en `created_by`). | Propiedad intelectual del entrenador. |
| `exercises` globales (is_global=true) | Indefinido. | — | No son datos personales. |
| `dr_planner_chats` | 180 días desde la última actualización. | `cron/cleanup` elimina chats con `updated_at < now() - 180d`. | Minimización; evita acumulación de datos sensibles. |
| `dr_planner_messages` | Ligado al chat (cascada). | Además, limpieza explícita por `created_at` si quedan huérfanos. | Coherencia con chats. |
| Avatares (`avatars` bucket) | Mientras el usuario o alumno exista. | Borrado sincrónico en `/api/account/delete` y `/api/students/[id]` DELETE. | Evita imágenes huérfanas. |
| Media de ejercicios (`exercise-media` bucket) | Mientras el ejercicio exista. | Borrado sincrónico en `/api/account/delete`. | Coherencia con datos. |
| Logs del proveedor (Supabase, Vercel) | Según su política (≤ 12 meses). | Gestionado por el proveedor. | Seguridad y diagnóstico. |

## Tras la supresión de cuenta

- Sistemas activos: ≤ 30 días desde la solicitud para garantizar purga completa de cachés de CDN y logs de función.
- Copias de seguridad cifradas: rotación del proveedor (≤ 90 días en Supabase Pro).

## Retención legal obligatoria

Actualmente no hay obligación fiscal/mercantil que exija conservación mínima de datos personales. Si se emiten facturas: 6 años art. 30 C.Com + 4 años plazo AEAT.
