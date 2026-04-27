'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ajouterAnecdote } from '@/app/actions/famille'

interface AjouterAnecdoteProps {
  membreId: string
}

export default function AjouterAnecdote({ membreId }: AjouterAnecdoteProps) {
  const [contenu, setContenu] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contenu.trim()) return
    setErreur(null)
    setIsPending(true)
    try {
      await ajouterAnecdote(membreId, contenu)
      setContenu('')
      router.refresh()
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <textarea
        value={contenu}
        onChange={e => setContenu(e.target.value)}
        placeholder="Ajouter une anecdote ou un souvenir sur ce membre..."
        rows={2}
        className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta resize-none"
      />
      {erreur && <p className="font-manrope text-xs text-red-600 mt-1">{erreur}</p>}
      <button
        type="submit"
        disabled={isPending || !contenu.trim()}
        className="mt-2 bg-terracotta text-white px-4 py-1.5 rounded-xl font-manrope text-sm font-semibold hover:bg-terracotta-deep disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Ajout...' : 'Ajouter'}
      </button>
    </form>
  )
}
