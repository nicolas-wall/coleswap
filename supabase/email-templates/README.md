# Plantillas de Supabase Auth

Generadas por `scripts/generar-plantillas-supabase.mjs` con el mismo diseño
que los mails de la app (`lib/emails/layout.ts`). **No editar a mano**: si hace
falta un cambio, se cambia el generador y se vuelve a correr — así el diseño
no se va separando del de la app en cada retoque.

Se cargan en **Supabase → Authentication → Emails → Templates**. Cada plantilla
tiene **dos campos**: el asunto (`Subject heading`) y el cuerpo (`Message body`).
El asunto NO va adentro del HTML, se carga aparte.

`{{ .ConfirmationURL }}` lo reemplaza Supabase por el enlace real. No tocarlo.

---

## Reset Password

**Subject heading** — copiar tal cual:

```
Cambiá tu contraseña de ColeSwap
```

**Message body** — pegar el contenido de `recuperar-contrasena.html`

## Confirm signup

**Subject heading** — copiar tal cual:

```
Confirmá tu cuenta de ColeSwap
```

**Message body** — pegar el contenido de `confirmar-cuenta.html`

## Magic Link

**Subject heading** — copiar tal cual:

```
Tu acceso a ColeSwap
```

**Message body** — pegar el contenido de `link-magico.html`

## Change Email Address

**Subject heading** — copiar tal cual:

```
Confirmá tu nuevo mail de ColeSwap
```

**Message body** — pegar el contenido de `cambio-de-mail.html`
