import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params
  const px = parseInt(size, 10)
  if (isNaN(px) || px < 16 || px > 1024) {
    return new Response('Taille invalide', { status: 400 })
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: px,
          height: px,
          background: '#C5563D',
          borderRadius: Math.round(px * 0.22),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FAF4EA',
          fontSize: Math.round(px * 0.52),
          fontWeight: 'bold',
          fontFamily: 'serif',
          letterSpacing: '-0.02em',
        }}
      >
        K
      </div>
    ),
    { width: px, height: px },
  )
}
