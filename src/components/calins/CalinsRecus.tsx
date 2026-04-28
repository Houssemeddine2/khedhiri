'use client'

import { useState } from 'react'
import type { Calin } from '@/types/calin'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'
import VoicePlayer from '@/components/timeline/VoicePlayer'

interface Props {
  calins: Calin[]
  onCalinsChange: () => void
}

export default function CalinsRecus({ calins, onCalinsChange }: Props) {
  const [ecouteId, setEcouteId] = useState<string | null>(null)

  const handleEcouter = async (c: Calin) => {
    setEcouteId(c.id)
    if (!c.ecoute_at) {
      await fetch(`/api/calins/${c.id}/ecouter`, { method: 'POST' })
      onCalinsChange()
    }
  }

  return (
    <section aria-labelledby="recus-titre">
      <h2 id="recus-titre" className="font-fraunces text-xl text-ink mb-3">
        Câlins reçus
      </h2>

      {calins.length === 0 ? (
        <p className="text-ink-soft font-manrope text-base">
          Pas encore de câlin reçu… mais ça ne saurait tarder 🤗
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {calins.map(c => {
            const av = avatarFromEmail(c.expediteur_email)
            const nonLu = !c.ecoute_at
            const ouvert = ecouteId === c.id

            return (
              <div
                key={c.id}
                className="bg-jasmine rounded-2xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${av.couleurBg} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
                    {av.initiale}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-manrope font-semibold text-sm text-ink truncate">
                      {c.titre}
                    </p>
                    <p className="font-manrope text-xs text-ink-soft">
                      De {c.expediteur_nom} · {tempsRelatif(c.envoye_at)}
                    </p>
                  </div>
                  {nonLu && (
                    <span className="flex-shrink-0 text-xs font-manrope font-bold bg-terracotta text-white px-2 py-0.5 rounded-full">
                      Nouveau !
                    </span>
                  )}
                </div>

                {ouvert ? (
                  <VoicePlayer url={c.vocal_url} duration={null} />
                ) : (
                  <button
                    onClick={() => handleEcouter(c)}
                    className="self-start flex items-center gap-2 px-4 py-2 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep transition-colors"
                  >
                    ▶ Écouter
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
