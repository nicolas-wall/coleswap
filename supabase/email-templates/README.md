# Plantillas de Supabase Auth

Generadas por `scripts/generar-plantillas-supabase.mjs` con el mismo diseño
que los mails de la app (`lib/emails/layout.ts`). **No editar a mano**: si hace
falta un cambio, se cambia el generador y se vuelve a correr.

Se pegan en Supabase → Authentication → Email Templates.

| Plantilla de Supabase | Archivo | Asunto sugerido |
|---|---|---|
| Reset Password | `recuperar-contrasena.html` | Cambiá tu contraseña de ColeSwap |
| Confirm signup | `confirmar-cuenta.html` | Confirmá tu cuenta de ColeSwap |
| Magic Link | `link-magico.html` | Tu acceso a ColeSwap |
| Change Email Address | `cambio-de-mail.html` | Confirmá tu nuevo mail de ColeSwap |
