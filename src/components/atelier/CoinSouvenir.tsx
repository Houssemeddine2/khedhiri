'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { deleteCreation } from '@/app/actions/atelier'
import { tempsRelatif } from '@/lib/avatar'
import AvatarCircle from '@/components/ui/AvatarCircle'
import type { Creation } from '@/types/creation'

const EMOJIS: Array<'❤️' | '😍' | '🎉'> = ['❤️', '😍', '🎉']

interface CoinSouvenirProps {
  userId: string
  onPublished: () => void
}

export default function CoinSouvenir({ userId, onPublished }: CoinSouvenirProps) {
  const [creations, setCreations] = useState<Creation[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [selected, setSelected] = useState<Creation | null>(null)
  const [enCoursReaction, setEnCoursReaction] = useState(false)
  const [enCoursPublication, setEnCoursPublication] = useState(false)
  const [enCoursSuppression, setEnCoursSuppression] = useState(false)
  const [enCoursUpload, setEnCoursUpload] = useState(false)
  const [messageSucces, setMessageSucces] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const chargerCreations = useCallback(async () => {
    try {
      setErreur(null)
      const res = await fetch('/api/creations')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Erreur lors du chargement')
      }
      const data: Creation[] = await res.json()
      setCreations(data)
      // Met à jour la création sélectionnée si elle est toujours dans la liste
      setSelected(prev => {
        if (!prev) return null
        const updated = data.find(c => c.id === prev.id)
        return updated ?? null
      })
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    chargerCreations()
  }, [chargerCreations])

  // ── Upload photo ────────────────────────────────────────────────────────────

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setEnCoursUpload(true)
    setErreur(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/creations', { method: 'POST', body: formData })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Erreur lors de l\'envoi')
      }
      const nouvelle: Creation = await res.json()
      setCreations(prev => [nouvelle, ...prev])
      afficherSucces('Dessin ajouté !')
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur lors de l\'envoi')
    } finally {
      setEnCoursUpload(false)
      // Réinitialise l'input pour permettre un re-upload du même fichier
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Réactions ───────────────────────────────────────────────────────────────

  async function toggleReaction(creationId: string, emoji: '❤️' | '😍' | '🎉') {
    setEnCoursReaction(true)
    try {
      const res = await fetch(`/api/creations/${creationId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Erreur réaction')
      }
      await chargerCreations()
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur lors de la réaction')
    } finally {
      setEnCoursReaction(false)
    }
  }

  // ── Publication sur le mur ──────────────────────────────────────────────────

  async function publierSurLeMur(creationId: string) {
    setEnCoursPublication(true)
    setErreur(null)
    try {
      const res = await fetch(`/api/creations/${creationId}/publier`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Erreur lors de la publication')
      }
      afficherSucces('Publié sur le mur familial !')
      onPublished()
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur lors de la publication')
    } finally {
      setEnCoursPublication(false)
    }
  }

  // ── Suppression ─────────────────────────────────────────────────────────────

  async function supprimerCreation(creation: Creation) {
    if (!confirm(`Supprimer ce dessin${creation.title ? ` « ${creation.title} »` : ''} ?`)) return
    setEnCoursSuppression(true)
    setErreur(null)
    try {
      await deleteCreation(creation.id)
      setCreations(prev => prev.filter(c => c.id !== creation.id))
      setSelected(null)
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur lors de la suppression')
    } finally {
      setEnCoursSuppression(false)
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function afficherSucces(msg: string) {
    setMessageSucces(msg)
    setTimeout(() => setMessageSucces(null), 3000)
  }

  function compterReactionsParEmoji(creation: Creation): Map<string, number> {
    const map = new Map<string, number>()
    for (const r of creation.reactions_creations ?? []) {
      map.set(r.emoji, (map.get(r.emoji) ?? 0) + 1)
    }
    return map
  }

  function utilisateurAReagi(creation: Creation, emoji: string): boolean {
    return (creation.reactions_creations ?? []).some(
      r => r.membre_id === userId && r.emoji === emoji
    )
  }

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton upload */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-xl text-ink">Coin souvenir</h2>
          <p className="font-manrope text-sm text-ink-soft mt-0.5">
            Tous les dessins de la famille
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={enCoursUpload}
          aria-label="Ajouter un dessin à la main"
          className="flex items-center gap-2 bg-terracotta text-white font-manrope text-sm font-medium px-4 py-2 rounded-xl shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enCoursUpload ? (
            <span className="animate-pulse">Envoi…</span>
          ) : (
            <>📸 Ajouter un dessin à la main</>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
          aria-label="Choisir un dessin à uploader"
        />
      </div>

      {/* Message de succès */}
      {messageSucces && (
        <div
          role="status"
          aria-live="polite"
          className="bg-olive/10 border border-olive/30 text-olive font-manrope text-sm px-4 py-2 rounded-xl"
        >
          {messageSucces}
        </div>
      )}

      {/* Message d'erreur */}
      {erreur && (
        <div
          role="alert"
          className="bg-terracotta/10 border border-terracotta/30 text-terracotta font-manrope text-sm px-4 py-2 rounded-xl"
        >
          {erreur}
        </div>
      )}

      {/* État de chargement */}
      {chargement && (
        <div className="grid grid-cols-3 gap-3" aria-label="Chargement des créations…">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-sand animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Grille des créations */}
      {!chargement && creations.length === 0 && (
        <div className="text-center py-16 text-ink-soft font-manrope">
          <p className="text-4xl mb-3">🎨</p>
          <p>Pas encore de dessins — soyez les premiers !</p>
        </div>
      )}

      {!chargement && creations.length > 0 && (
        <div
          className="grid grid-cols-3 gap-3"
          role="list"
          aria-label="Galerie des créations familiales"
        >
          {creations.map(creation => {
            const compteurs = compterReactionsParEmoji(creation)
            const isSelected = selected?.id === creation.id
            const nomAuteur = creation.profiles?.nom ?? 'Famille'

            return (
              <button
                key={creation.id}
                role="listitem"
                onClick={() => setSelected(isSelected ? null : creation)}
                aria-pressed={isSelected}
                aria-label={`${creation.title ?? 'Dessin'} par ${nomAuteur}`}
                className={`relative rounded-xl overflow-hidden border-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
                  isSelected
                    ? 'border-terracotta shadow-md scale-[0.98]'
                    : 'border-sand-warm shadow-sm hover:border-terracotta/50 hover:shadow-md'
                }`}
              >
                {/* Image */}
                <img
                  src={creation.media_url}
                  alt={creation.title ?? `Dessin de ${nomAuteur}`}
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                />

                {/* Badge source */}
                <span
                  className={`absolute top-1.5 left-1.5 font-manrope text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    creation.source === 'digital'
                      ? 'bg-azur/80 text-white'
                      : 'bg-terracotta/80 text-white'
                  }`}
                >
                  {creation.source === 'digital' ? 'numérique' : 'photo'}
                </span>

                {/* Auteur + date */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    <AvatarCircle
                      email={creation.profiles?.email ?? ''}
                      nom={creation.profiles?.nom}
                      avatarUrl={creation.profiles?.avatar_url}
                      couleur={creation.profiles?.couleur}
                      size="xs"
                    />
                    <span className="font-manrope text-white text-[10px] truncate">
                      {nomAuteur}
                    </span>
                  </div>
                </div>

                {/* Compteurs de réactions (si > 0) */}
                {compteurs.size > 0 && (
                  <div className="absolute top-1.5 right-1.5 flex flex-col gap-0.5">
                    {EMOJIS.map(emoji => {
                      const n = compteurs.get(emoji) ?? 0
                      if (n === 0) return null
                      return (
                        <span
                          key={emoji}
                          className="bg-black/50 rounded-full px-1 py-0.5 font-manrope text-[10px] text-white leading-none"
                          aria-label={`${n} ${emoji}`}
                        >
                          {emoji} {n}
                        </span>
                      )
                    })}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Panneau de détail */}
      {selected && (
        <div
          className="mt-4 bg-jasmine border border-sand-warm rounded-2xl shadow-md overflow-hidden"
          aria-label={`Détail : ${selected.title ?? 'Dessin'}`}
        >
          {/* Barre de titre */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-sand-warm">
            <div className="flex items-center gap-2">
              <AvatarCircle
                email={selected.profiles?.email ?? ''}
                nom={selected.profiles?.nom}
                avatarUrl={selected.profiles?.avatar_url}
                couleur={selected.profiles?.couleur}
                size="sm"
              />
              <div>
                <p className="font-manrope text-sm font-medium text-ink">
                  {selected.profiles?.nom ?? 'Famille'}
                </p>
                <p className="font-manrope text-xs text-ink-soft">
                  {tempsRelatif(selected.created_at)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              aria-label="Fermer le détail"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-sand hover:bg-sand-warm text-ink-soft hover:text-ink transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          {/* Image agrandie */}
          <div className="p-4">
            <img
              src={selected.media_url}
              alt={selected.title ?? `Dessin de ${selected.profiles?.nom ?? 'la famille'}`}
              className="w-full max-h-80 object-contain rounded-xl bg-sand"
            />

            {selected.title && (
              <p className="font-caveat text-ink text-base mt-2 text-center">
                {selected.title}
              </p>
            )}
          </div>

          {/* Réactions */}
          <div className="px-4 pb-3">
            <p className="font-manrope text-xs text-ink-soft mb-2">Réagir :</p>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map(emoji => {
                const aReagi = utilisateurAReagi(selected, emoji)
                const n = (selected.reactions_creations ?? []).filter(r => r.emoji === emoji).length
                return (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction(selected.id, emoji)}
                    disabled={enCoursReaction}
                    aria-label={`${aReagi ? 'Retirer' : 'Ajouter'} la réaction ${emoji}${n > 0 ? ` (${n})` : ''}`}
                    aria-pressed={aReagi}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-manrope text-sm font-medium transition-colors disabled:opacity-50 ${
                      aReagi
                        ? 'bg-terracotta text-white'
                        : 'bg-sand border border-sand-warm text-ink-soft hover:bg-sand-warm'
                    }`}
                  >
                    <span>{emoji}</span>
                    {n > 0 && <span className="text-xs">{n}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            <button
              onClick={() => publierSurLeMur(selected.id)}
              disabled={enCoursPublication || selected.author_id !== userId}
              aria-label="Publier cette création sur le mur familial"
              title={
                selected.author_id !== userId
                  ? 'Seul l\'auteur peut publier'
                  : 'Publier sur le mur familial'
              }
              className="flex items-center gap-1.5 bg-azur text-white font-manrope text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {enCoursPublication ? (
                <span className="animate-pulse">Publication…</span>
              ) : (
                <>📢 Publier sur le mur</>
              )}
            </button>

            {selected.author_id === userId && (
              <button
                onClick={() => supprimerCreation(selected)}
                disabled={enCoursSuppression}
                aria-label="Supprimer cette création"
                className="flex items-center gap-1.5 bg-sand border border-sand-warm text-ink-soft font-manrope text-sm font-medium px-4 py-2 rounded-xl hover:border-terracotta hover:text-terracotta transition-colors disabled:opacity-40"
              >
                {enCoursSuppression ? (
                  <span className="animate-pulse">Suppression…</span>
                ) : (
                  <>🗑️ Supprimer</>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
