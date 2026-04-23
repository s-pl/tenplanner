# Contrato de Encargo del Tratamiento (DPA) — plantilla interna

El texto público está embebido en `/terminos` (apartado 3 «Encargo del tratamiento»). Aquí se mantiene la versión extendida y el mapping con los artículos del RGPD.

**Responsable:** el entrenador registrado.
**Encargado:** TenPlanner — `<!-- TODO: razón social -->`.

## Mapping RGPD art. 28.3

| Letra | Exigencia | Dónde se cumple |
| --- | --- | --- |
| a | Tratar solo bajo instrucciones documentadas. | `/terminos` §3.3 primer punto. |
| b | Confidencialidad del personal. | `/terminos` §3.3 segundo punto + políticas internas. |
| c | Seguridad art. 32. | `/privacidad` §9 (medidas técnicas). |
| d | Subencargados con autorización previa. | `docs/legal/subprocessors.md` + aviso en `/privacidad` §5. |
| e | Asistencia para derechos del interesado. | `/terminos` §3.3 + `/api/export` + borrado. |
| f | Asistencia para los arts. 32-36. | `breach-procedure.md`. |
| g | Devolver o suprimir al finalizar. | `/terminos` §3.3 último punto. |
| h | Poner a disposición información para demostrar cumplimiento. | `docs/legal/*` a solicitud del responsable. |

## Subencargados

Lista en `subprocessors.md`. El responsable autoriza su contratación al aceptar `/terminos`. Cualquier nuevo subencargado se anuncia con antelación razonable y permite al responsable oponerse.

## Duración y terminación

Mientras el entrenador mantenga cuenta activa. A la terminación, los datos se borran en ≤ 30 días.

## Acreditaciones

TenPlanner puede aportar al responsable, a petición razonable:

- Registro RAT simplificado.
- Resumen de medidas de seguridad.
- Copia de DPAs con subencargados (enlaces públicos en `subprocessors.md`).
- Certificaciones del hosting (SOC 2 de Supabase y Vercel).

## Versionado

- **v1.0** — 2026-04-23. Versión inicial.
