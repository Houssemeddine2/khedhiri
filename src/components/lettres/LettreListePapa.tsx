'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { membreById } from '@/lib/membres'
import type { LettrePapa } from '@/types/lettre'
import LettreEditor from './LettreEditor'

interface LettreListePapaProps {
  lettres: LettrePapa[]
}

export default function LettreListePapa({ lettres }: LettreListePapaProps) {
  const router = useRouter()
  const [showEditor, setShowEditor] = useState(false)
  const [editingLettre, setEditingLettre] = useState<LettrePapa | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette lettre définitivement ?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/lettres/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        alert(data.error ?? 'Erreur lors de la suppression')
        return
      }
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-fraunces text-2xl font-bold text-ink">Lettres pour leurs 18 ans 📜</h1>
            <p className="font-manrope text-sm text-ink-soft mt-1">Tes lettres scellées, en attente de s&apos;ouvrir.</p>
          </div>
          <button
            onClick={() => { setEditingLettre(null); setShowEditor(true) }}
            className="px-4 py-2 rounded-xl bg-terracotta text-white font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors"
          >
            + Écrire
          </button>
        </div>

        {lettres.length === 0 ? (
          <p className="font-manrope text-sm text-ink-soft italic text-center py-12">
            Tu n&apos;as pas encore écrit de lettre. La première fois est toujours la plus belle.
          </p>
        ) : (
          <div className="space-y-3">
            {lettres.map(l => {
              const decouverte = new Date(l.unlock_at) <= new Date()
              return (
                <div key={l.id} className="bg-white rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-fraunces text-base font-bold text-ink truncate">{l.titre}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-manrope font-semibold ${
                        decouverte ? 'bg-olive/20 text-olive' : 'bg-sand text-ink-soft'
                      }`}>
                        {decouverte ? '✅ Déverrouillée' : '🔒 Verrouillée'}
                      </span>
                    </div>
                    <p className="font-manrope text-xs text-ink-soft mt-1">
                      Pour {membreById(l.destinataire_id)?.nom ?? l.destinataire_id} · s&apos;ouvre le {new Date(l.unlock_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {!decouverte && (
                      <button
                        onClick={() => { setEditingLettre(l); setShowEditor(true) }}
                        aria-label={`Modifier « ${l.titre} »`}
                        className="font-manrope text-xs text-ink-soft hover:text-terracotta transition-colors"
                      >
                        Modifier
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(l.id)}
                      disabled={deletingId === l.id}
                      aria-label={`Supprimer « ${l.titre} »`}
                      className="font-manrope text-xs text-terracotta hover:underline disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showEditor && (
        <LettreEditor
          lettre={editingLettre ?? undefined}
          onClose={() => { setShowEditor(false); setEditingLettre(null) }}
        />
      )}
    </>
  )
}
