'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MembreFamille, Anecdote } from '@/types/famille'
import { supprimerAnecdote, supprimerMembre } from '@/app/actions/famille'
import { avatarFromEmail } from '@/lib/avatar'
import AjouterAnecdote from './AjouterAnecdote'

interface MembreDetailProps {
  membre: MembreFamille
  anecdotes: Anecdote[]
  currentUserId: string
  isPapa: boolean
  onClose: () => void
}

export default function MembreDetail({ membre, anecdotes, currentUserId, isPapa, onClose }: MembreDetailProps) {
  const router = useRouter()
  const [isDeletingMembre, setIsDeletingMembre] = useState(false)
  const [deletingAnecdoteId, setDeletingAnecdoteId] = useState<string | null>(null)

  async function handleSupprimerMembre() {
    if (!confirm(`Supprimer ${membre.prenom} de l'arbre ?`)) return
    setIsDeletingMembre(true)
    try {
      await supprimerMembre(membre.id)
      router.refresh()
      onClose()
    } finally {
      setIsDeletingMembre(false)
    }
  }

  async function handleSupprimerAnecdote(id: string) {
    setDeletingAnecdoteId(id)
    try {
      await supprimerAnecdote(id)
      router.refresh()
    } finally {
      setDeletingAnecdoteId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-jasmine rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {membre.photo_url && (
              <img src={membre.photo_url} alt={membre.prenom} className="w-14 h-14 rounded-full object-cover" />
            )}
            <div>
              <h2 className="font-fraunces text-xl font-bold text-ink">
                {membre.surnom ?? membre.prenom}
              </h2>
              {membre.surnom && (
                <p className="font-manrope text-sm text-ink-soft">{membre.prenom} {membre.nom ?? ''}</p>
              )}
              <p className="font-manrope text-sm text-terracotta">{membre.relation}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-2xl leading-none" aria-label="Fermer">×</button>
        </div>

        {/* Infos */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm font-manrope">
          {membre.date_naissance && (
            <div><span className="text-ink-soft">Né(e) le : </span><span className="text-ink">{new Date(membre.date_naissance).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</span></div>
          )}
          {membre.lieu_naissance && (
            <div><span className="text-ink-soft">À : </span><span className="text-ink">{membre.lieu_naissance}</span></div>
          )}
        </div>

        {membre.bio && (
          <p className="font-manrope text-sm text-ink leading-relaxed mb-4 bg-sand rounded-xl p-3 whitespace-pre-wrap">{membre.bio}</p>
        )}

        {/* Anecdotes */}
        <div className="border-t border-sand-warm pt-4">
          <h3 className="font-fraunces text-base font-bold text-ink mb-3">Anecdotes & souvenirs</h3>
          {anecdotes.length === 0 ? (
            <p className="font-manrope text-sm text-ink-soft italic">Pas encore d'anecdotes. Sois le premier !</p>
          ) : (
            <div className="space-y-2 mb-3">
              {anecdotes.map(a => {
                const auteur = avatarFromEmail(a.profiles?.email ?? '')
                const peutSupprimer = isPapa || currentUserId === a.user_id
                return (
                  <div key={a.id} className="bg-white rounded-xl p-3 text-sm">
                    <p className="font-manrope text-ink">{a.contenu}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-manrope text-xs text-ink-soft">— {a.profiles?.nom ?? auteur.nom}</span>
                      {peutSupprimer && (
                        <button
                          onClick={() => handleSupprimerAnecdote(a.id)}
                          disabled={deletingAnecdoteId === a.id}
                          className="font-manrope text-xs text-terracotta hover:underline disabled:opacity-50"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <AjouterAnecdote membreId={membre.id} />
        </div>

        {/* Supprimer membre (Papa only) */}
        {isPapa && (
          <div className="mt-4 pt-4 border-t border-sand-warm">
            <button
              onClick={handleSupprimerMembre}
              disabled={isDeletingMembre}
              className="font-manrope text-sm text-terracotta hover:underline disabled:opacity-50"
            >
              Supprimer ce membre de l'arbre
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
