/**
 * Diseño compartido de todos los mails de ColeSwap.
 *
 * De acá salen tanto los mails que manda la app como las plantillas de auth de
 * Supabase (ver scripts/generar-plantillas-supabase.mjs), así que el aspecto es
 * literalmente el mismo código y no dos diseños que se van separando con el tiempo.
 *
 * Restricciones de mail, no de web: tablas en vez de flex/grid, estilos inline,
 * y colores en hex — Outlook y Gmail ignoran hojas de estilo, y ningún cliente
 * entiende el oklch() que usa la app.
 */

/** Paleta de app/globals.css, convertida de oklch a hex. */
export const C = {
  fondo: '#fefdfa',      // --background
  texto: '#0b110d',      // --foreground
  tarjeta: '#ffffff',    // --card
  primario: '#005e31',   // --primary
  sobrePrimario: '#f3fbf5',
  suave: '#f3f2ed',      // --muted
  textoSuave: '#5d6660', // --muted-foreground
  destaque: '#f4ebd1',   // --accent
  sobreDestaque: '#342d1c',
  borde: '#d8e0da',      // --border
} as const

// La app usa una serif cálida (Fraunces) para los títulos. Las webfonts no son
// confiables en mail, así que se usa una pila serif que evoca lo mismo con lo
// que ya está instalado.
const SERIF = "Georgia, 'Times New Roman', Times, serif"
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export interface EmailLayoutOptions {
  /** Título grande, arriba del cuerpo. */
  titulo: string
  /** HTML del cuerpo. Usá parrafo() para que herede la tipografía. */
  cuerpo: string
  cta?: { texto: string; url: string }
  /** Texto chico bajo el botón: la URL en texto plano, avisos, etc. */
  pie?: string
  /** Preheader: lo que se ve en la lista de la bandeja, junto al asunto. */
  vistaPrevia?: string
}

export function parrafo(html: string, opts: { chico?: boolean } = {}) {
  const size = opts.chico ? '13px' : '15px'
  const color = opts.chico ? C.textoSuave : '#3f4a43'
  return `<p style="margin:0 0 12px;font-family:${SANS};font-size:${size};line-height:1.6;color:${color};">${html}</p>`
}

export function emailLayout({ titulo, cuerpo, cta, pie, vistaPrevia }: EmailLayoutOptions) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:${C.fondo};">
${vistaPrevia ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${vistaPrevia}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.fondo};padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

      <!-- Marca -->
      <tr><td style="padding:0 4px 16px;">
        <span style="font-family:${SERIF};font-size:22px;font-weight:700;color:${C.primario};letter-spacing:-0.01em;">ColeSwap</span>
      </td></tr>

      <!-- Tarjeta -->
      <tr><td style="background:${C.tarjeta};border:1px solid ${C.borde};border-radius:14px;padding:32px 30px;">
        <h1 style="margin:0 0 16px;font-family:${SERIF};font-size:24px;line-height:1.25;font-weight:700;color:${C.texto};">${titulo}</h1>
        ${cuerpo}
        ${cta ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;">
          <tr><td style="background:${C.primario};border-radius:9px;">
            <a href="${cta.url}" style="display:inline-block;padding:13px 26px;font-family:${SANS};font-size:15px;font-weight:600;color:${C.sobrePrimario};text-decoration:none;">${cta.texto}</a>
          </td></tr>
        </table>` : ''}
        ${pie ? `<p style="margin:22px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.textoSuave};word-break:break-all;">${pie}</p>` : ''}
      </td></tr>

      <!-- Pie -->
      <tr><td style="padding:18px 6px 0;">
        <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.textoSuave};">
          ColeSwap · el mercado de libros y uniformes de tu colegio.<br>
          Entre familias del mismo cole, sin pagos online.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}
