# Carpeta `docs/legal`

Documentación interna de cumplimiento RGPD + LOPDGDD. Estos archivos **no se publican** a los usuarios: son evidencia para auditorías, responder a la AEPD y onboarding del equipo.

## Índice

| Archivo | Propósito | Actualizar |
| --- | --- | --- |
| [RAT.md](./RAT.md) | Registro de Actividades de Tratamiento (art. 30 RGPD). | Cada vez que se añada o cambie una finalidad. |
| [subprocessors.md](./subprocessors.md) | Lista de encargados/subencargados con ubicación, DPA y garantías. | Antes de contratar cualquier nuevo proveedor que acceda a datos personales. |
| [retention-policy.md](./retention-policy.md) | Plazos de conservación por tabla y mecanismo de purga. | Al cambiar lógica de borrado o cron de retención. |
| [breach-procedure.md](./breach-procedure.md) | Procedimiento de notificación de brechas en 72 horas a la AEPD. | Revisión anual o tras incidente. |
| [DPA-template.md](./DPA-template.md) | Contrato de encargo del tratamiento (referencia del texto embebido en `/terminos`). | Al cambiar términos públicos. |

## Contactos rápidos

- **AEPD — notificación de brechas:** <https://sedeagpd.gob.es/sede-electronica-web/vistas/formBrechaSeguridad/procedimientoBrechaSeguridad.jsf>
- **Soporte Anthropic (solicitar Zero Data Retention):** <privacy@anthropic.com>
- **DPA Supabase:** <https://supabase.com/privacy/dpa>
- **DPA Anthropic:** <https://www.anthropic.com/legal/dpa>
- **DPA Vercel:** <https://vercel.com/legal/dpa>

## Responsabilidades

| Rol | Quién | Tareas |
| --- | --- | --- |
| Responsable del tratamiento | `<!-- TODO: titular -->` | Mantener RAT, firmar DPAs, decidir plazos, notificar brechas. |
| DPO (si aplica) | `<!-- TODO -->` | Punto de contacto AEPD, revisión anual. |
| Encargados | Supabase, Anthropic, Vercel, Pexels | Cumplir instrucciones + DPA. |
