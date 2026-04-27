interface HighlightCardProps {
  emoji: string
  titre: string
  description: string
  accent?: 'azur' | 'terracotta' | 'olive' | 'gold'
}

const ACCENT = {
  azur:       'border-azur/30 bg-azur/5',
  terracotta: 'border-terracotta/30 bg-terracotta/5',
  olive:      'border-olive/30 bg-olive/5',
  gold:       'border-gold/30 bg-gold/5',
}

export default function HighlightCard({ emoji, titre, description, accent = 'azur' }: HighlightCardProps) {
  return (
    <div className={`rounded-2xl border p-4 flex gap-3 items-start ${ACCENT[accent]}`}>
      <span className="text-3xl flex-shrink-0" role="img" aria-hidden="true">{emoji}</span>
      <div>
        <p className="font-manrope font-semibold text-ink text-sm">{titre}</p>
        <p className="font-manrope text-ink-soft text-xs mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
