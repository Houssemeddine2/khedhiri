interface MotCardProps {
  langue: string
  drapeau: string
  mot: string
  phonetique?: string
  traduction: string
  exemple: string
  couleurBg: string
}

export default function MotCard({ langue, drapeau, mot, phonetique, traduction, exemple, couleurBg }: MotCardProps) {
  return (
    <div className={`rounded-2xl p-5 ${couleurBg}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl" role="img" aria-hidden="true">{drapeau}</span>
        <span className="font-manrope text-xs font-semibold text-ink-soft uppercase tracking-wider">{langue}</span>
      </div>
      <p className="font-fraunces text-3xl font-bold text-ink italic mb-1">{mot}</p>
      {phonetique && (
        <p className="font-manrope text-sm text-ink-soft mb-2">[{phonetique}]</p>
      )}
      <p className="font-manrope text-sm font-semibold text-ink mb-3">{traduction}</p>
      <p className="font-caveat text-base text-ink-soft leading-relaxed border-l-2 border-current pl-3">{exemple}</p>
    </div>
  )
}
