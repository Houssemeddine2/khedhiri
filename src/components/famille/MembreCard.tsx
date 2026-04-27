'use client'

import type { MembreFamille } from '@/types/famille'

interface MembreCardProps {
  membre: MembreFamille
  onClick: () => void
}

const EMOJI_DEFAUT: Record<string, string> = {
  'grand-père': '👴', 'grand-mère': '👵',
  'père': '👨', 'mère': '👩',
  'oncle': '👨', 'tante': '👩',
  'cousin': '👦', 'cousine': '👧',
  'frère': '👦', 'sœur': '👧',
}

function emojiRelation(relation: string): string {
  const key = Object.keys(EMOJI_DEFAUT).find(k => relation.toLowerCase().includes(k))
  return key ? EMOJI_DEFAUT[key] : '👤'
}

export default function MembreCard({ membre, onClick }: MembreCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-jasmine border border-sand-warm rounded-2xl p-4 text-center hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-terracotta w-full"
      aria-label={`${membre.surnom ?? membre.prenom} — ${membre.relation}`}
    >
      {membre.photo_url ? (
        <img
          src={membre.photo_url}
          alt={membre.prenom}
          className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
          loading="lazy"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center mx-auto mb-2 text-3xl">
          {emojiRelation(membre.relation)}
        </div>
      )}
      <p className="font-fraunces font-bold text-ink text-sm leading-tight">
        {membre.surnom ?? membre.prenom}
      </p>
      {membre.surnom && (
        <p className="font-manrope text-xs text-ink-soft">{membre.prenom} {membre.nom ?? ''}</p>
      )}
      <p className="font-manrope text-xs text-terracotta mt-1">{membre.relation}</p>
      {membre.lieu_naissance && (
        <p className="font-manrope text-xs text-ink-soft mt-0.5">📍 {membre.lieu_naissance}</p>
      )}
    </button>
  )
}
