import { ImageResponse } from 'next/og'

// Imagen de preview para cuando alguien pega el link en el grupo de WhatsApp
// del colegio, que es como se reparte esto en la práctica.
export const alt = 'ColeSwap — el mercado de libros y uniformes de tu colegio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#1f6b45',
          color: '#fdfaf5',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 104, fontWeight: 700, letterSpacing: '-0.03em' }}>
          ColeSwap
        </div>
        <div style={{ fontSize: 44, marginTop: 24, lineHeight: 1.3, opacity: 0.92 }}>
          Libros y uniformes entre las familias de tu colegio
        </div>
        <div style={{ fontSize: 30, marginTop: 40, opacity: 0.7 }}>
          Sin pagos online · Solo familias del colegio
        </div>
      </div>
    ),
    size
  )
}
