# Procedimiento de gestión de brechas de seguridad

Exigido por los arts. 33-34 RGPD. Plazo máximo para notificar a la AEPD: **72 horas** desde que tenemos conocimiento de la brecha.

**Última revisión:** 2026-04-23

## 1. Definición

Brecha = incidente de seguridad que ocasione destrucción, pérdida, alteración, comunicación o acceso no autorizado a datos personales tratados.

## 2. Fuentes de detección

- Alertas de Supabase / Vercel.
- Reportes de usuarios vía email de contacto.
- Revisión de logs de acceso inusuales.
- Escaneo automático de dependencias (`pnpm audit`).

## 3. Roles

| Rol | Quién | Responsabilidad |
| --- | --- | --- |
| Primer respondedor | Quien detecta la brecha. | Registrar en log interno, alertar al responsable. |
| Coordinador | `<!-- TODO: nombre del titular -->` | Valorar impacto, decidir notificación AEPD e interesados, liderar contención. |
| DPO (si aplica) | `<!-- TODO -->` | Asesoría legal, enlace con AEPD. |

## 4. Flujo

### 4.1. Primera hora (contención)

1. Anotar: fecha/hora detección, síntoma, sistemas afectados.
2. Si hay fuga activa: revocar tokens, rotar claves de servicio (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, claves API), invalidar sesiones.
3. Aislar: si un endpoint filtra datos, desplegar parche o retirar ruta del servicio.

### 4.2. Evaluación (≤ 24 h)

Responder por escrito:

- Qué datos (categorías + nº aproximado de afectados).
- Qué interesados (entrenadores, alumnos, otros).
- Consecuencias probables (identidad, salud, económico, reputación).
- ¿Riesgo alto para derechos y libertades? → determina obligación de notificar a interesados (art. 34).

### 4.3. Notificación a AEPD (≤ 72 h)

Salvo que la brecha sea improbable que entrañe riesgo.

- Formulario oficial: <https://sedeagpd.gob.es/sede-electronica-web/vistas/formBrechaSeguridad/procedimientoBrechaSeguridad.jsf>
- Incluir: naturaleza, categorías y nº, medidas adoptadas, datos de contacto del coordinador.
- Si a las 72 h aún no se tienen todos los datos: notificación escalonada (avisar al respecto).

### 4.4. Comunicación a los interesados (si alto riesgo)

Lenguaje claro, sin dilación indebida. Canales: email registrado en la cuenta + aviso en la app. Contenido mínimo (art. 34.2 RGPD):

- Naturaleza de la brecha.
- Datos de contacto para más información.
- Consecuencias probables.
- Medidas adoptadas o propuestas para atenuar el impacto.

Excepciones para no comunicar: datos cifrados, medidas posteriores que eliminan el alto riesgo, comunicación supone esfuerzo desproporcionado (→ comunicación pública alternativa).

### 4.5. Post-mortem (≤ 30 días)

- Causa raíz.
- Acciones correctivas (parche, cambio de proceso, formación).
- Actualización de este documento si procede.

## 5. Registro interno de brechas

Incluso cuando no se notifique a la AEPD, toda brecha se documenta internamente (art. 33.5 RGPD). Formato mínimo:

```
ID:
Fecha detección:
Descripción:
Categorías de datos:
Categorías de interesados:
Nº aproximado de afectados:
Medidas de contención:
Evaluación de riesgo (bajo/medio/alto):
Notificada a AEPD (sí/no + fecha + referencia):
Notificada a interesados (sí/no + fecha):
Lecciones aprendidas:
```

Ubicar el registro en `docs/legal/breach-log.md` (crear al detectar la primera; mantenerlo fuera del repo público si contiene detalles sensibles).

## 6. Simulacro

Probar este procedimiento al menos una vez al año. Documentar el simulacro en `breach-log.md`.
