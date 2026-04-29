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

  const heart = Math.round(px * 0.54)

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
        }}
      >
        <svg
          width={heart}
          height={heart}
          viewBox="0 0 24 24"
          fill="#FAF4EA"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
    ),
    { width: px, height: px },
  )
}
