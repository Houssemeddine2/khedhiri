import { avatarFromEmail } from '@/lib/avatar'

const COULEUR_BG: Record<string, string> = {
  terracotta: 'bg-terracotta',
  olive:      'bg-olive',
  azur:       'bg-azur',
  gold:       'bg-gold',
  rose:       'bg-rose',
}

const SIZE: Record<string, string> = {
  xs:  'w-5 h-5 text-xs',
  sm:  'w-6 h-6 text-xs',
  md:  'w-8 h-8 text-sm',
  lg:  'w-10 h-10 text-base',
  xl:  'w-16 h-16 text-2xl',
  '2xl': 'w-24 h-24 text-4xl',
}

interface AvatarCircleProps {
  email: string
  nom?: string | null
  avatarUrl?: string | null
  couleur?: string | null
  size?: keyof typeof SIZE
  className?: string
}

export default function AvatarCircle({
  email, nom, avatarUrl, couleur, size = 'md', className = '',
}: AvatarCircleProps) {
  const fallback = avatarFromEmail(email)
  const bg = couleur ? (COULEUR_BG[couleur] ?? fallback.couleurBg) : fallback.couleurBg

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={nom ?? fallback.nom}
        className={`${SIZE[size]} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${SIZE[size]} rounded-full ${bg} flex items-center justify-center text-white font-bold font-manrope flex-shrink-0 ${className}`}
      aria-label={nom ?? fallback.nom}
    >
      {fallback.initiale}
    </div>
  )
}
