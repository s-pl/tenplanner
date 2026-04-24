# Email templates — TenPlanner

Plantillas HTML para los correos transaccionales de autenticación que envía Supabase. Están pensadas para copiarse en:

**Supabase Dashboard → Authentication → Emails → Templates**

Cada plantilla tiene un destino fijo:

| Archivo | Pegar en → | Asunto sugerido |
|---|---|---|
| `confirm-signup.html` | **Confirm signup** | `Confirma tu cuenta · TenPlanner` |
| `magic-link.html` | **Magic Link** | `Tu enlace de acceso · TenPlanner` |
| `reset-password.html` | **Reset Password** | `Recuperar contraseña · TenPlanner` |
| `change-email.html` | **Change Email Address** | `Confirma tu nuevo correo · TenPlanner` |

## Variables de Supabase

Las plantillas usan la sintaxis Go `{{ .Variable }}` que Supabase sustituye al enviar:

| Variable | Qué es |
|---|---|
| `{{ .ConfirmationURL }}` | URL completa que pulsa el usuario (ya firmada por Supabase) |
| `{{ .SiteURL }}` | URL base del proyecto (definida en **Settings → Auth → Site URL**) |
| `{{ .Email }}` | Email del destinatario |
| `{{ .Token }}` | OTP de 6 dígitos (solo si activas **OTP + link**) |
| `{{ .TokenHash }}` | Hash del token |
| `{{ .RedirectTo }}` | URL de redirección tras el click |

Las plantillas que ves solo usan `{{ .ConfirmationURL }}`. Si prefieres enseñar un OTP visible junto al botón, añade dentro del bloque del CTA:

```html
<p style="margin:18px 0 0 0;font-size:12px;color:#6b6b6b;">
  ¿Prefieres un código? Úsalo en la app:
  <span style="font-family:'SF Mono',Consolas,monospace;letter-spacing:0.22em;font-size:18px;color:#111111;">
    {{ .Token }}
  </span>
</p>
```

## Configuración necesaria en Supabase

Antes de que los emails funcionen en producción, revisa:

1. **Auth → URL Configuration → Site URL**
   - Dev: `http://localhost:3000`
   - Prod: `https://<tu-dominio>`

2. **Auth → URL Configuration → Redirect URLs** (allowlist). Debe incluir TODOS los destinos a los que apuntan `redirectTo` desde el cliente:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/reset-password`
   - `https://<tu-dominio>/auth/callback`
   - `https://<tu-dominio>/reset-password`

3. **Auth → Emails → SMTP Settings** — en producción sustituye el SMTP de Supabase (rate-limit bajo) por uno propio (Resend, Postmark, SES…).

4. **Auth → Emails → Templates** — pega cada HTML en el panel correspondiente. Nota: Supabase NO interpreta `<style>` en bloque; todo debe ser CSS inline (las plantillas ya lo están).

## Sobre el estilo

- Paleta: verde de marca `#188046`, tinta `#111111`, textos secundarios `#6b6b6b`, fondo `#f6f5f2`, borde `#e6e4df`.
- Tipografía: Georgia para los títulos (editorial), system-ui para el cuerpo (legibilidad universal en clientes email).
- Ancho fijo 560 px centrado; apilado vertical sin columnas, cero dependencias, cero imágenes externas — así se ve igual en Gmail, Apple Mail, Outlook y clientes oscuros.
- CTA negro sólido, sin bordes redondeados (`border-radius` no es 100% fiable en Outlook).
- `preheader` (el preview en la bandeja) está en cada plantilla como primer `<div>` oculto.

## Cómo previsualizar antes de pegar

Dos opciones:

- **Navegador directo**: abre el `.html` con `file://` y verás el render aproximado (sin ser idéntico al cliente email).
- **Litmus / Email on Acid / Mailtrap**: pega el HTML para probar render en Outlook, Gmail, Apple Mail, clients oscuros, etc.

## Cambios menores futuros

- Si cambias la paleta, los hex a tocar son `#188046`, `#f6f5f2`, `#e6e4df`, `#111111`.
- Si cambias el wording del producto, el único texto compartido es el tagline del footer: `Padel planner para entrenadores`.
- Si añades una imagen de cabecera, súbela a un host estable (Supabase Storage público, Cloudinary, o `/public/og/...` en tu dominio) y usa URL absoluta — nunca adjuntes.
