'use client'

import { useState } from 'react'
import type { EmailMessageDetail } from '@/types/email'
import EmailCompose from './EmailCompose'

interface EmailMessageProps {
  message: EmailMessageDetail
  isPapa: boolean
  folder: string
  onBack: () => void
  onDeleted: () => void
}

export default function EmailMessage({ message, isPapa, folder, onBack, onDeleted }: EmailMessageProps) {
  const [showCompose, setShowCompose] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteErreur, setDeleteErreur] = useState<string | null>(null)

  async function handleDelete() {
    if (!confirm('Supprimer ce message ?')) return
    setIsDeleting(true)
    setDeleteErreur(null)
    try {
      const res = await fetch(`/api/email/message/${message.uid}?folder=${encodeURIComponent(folder)}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setDeleteErreur(data.error ?? 'Impossible de supprimer le message')
        return
      }
      onDeleted()
    } catch {
      setDeleteErreur('Impossible de supprimer le message')
    } finally {
      setIsDeleting(false)
    }
  }

  const replySubject = message.subject.startsWith('Re:') ? message.subject : `Re: ${message.subject}`

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <button onClick={onBack} className="font-manrope text-sm text-ink-soft hover:text-ink mb-4 flex items-center gap-1">
          ← Retour
        </button>
        <h1 className="font-fraunces text-xl font-bold text-ink mb-1">{message.subject}</h1>
        <div className="flex items-center justify-between mb-4">
          <div className="font-manrope text-sm text-ink-soft">
            <span>De : {message.fromName ? `${message.fromName} <${message.from}>` : message.from}</span>
            <span className="mx-2">·</span>
            <span>{new Date(message.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 font-manrope text-sm text-ink leading-relaxed mb-4">
          {message.body
            ? <span className="whitespace-pre-wrap">{message.body}</span>
            : message.html
              ? <span className="text-ink-soft italic text-xs">(email au format HTML — aperçu texte non disponible)</span>
              : <span className="text-ink-soft italic">(message vide)</span>
          }
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCompose(true)}
            className="px-4 py-2 rounded-xl bg-terracotta text-white font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors"
          >
            Répondre
          </button>
          {isPapa && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl border border-sand-warm font-manrope text-sm text-terracotta hover:bg-sand transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          )}
        </div>
        {deleteErreur && (
          <p className="font-manrope text-xs text-red-600 mt-1">{deleteErreur}</p>
        )}
      </div>
      {showCompose && (
        <EmailCompose
          isPapa={isPapa}
          defaultTo={message.from}
          defaultSubject={replySubject}
          onSent={() => setShowCompose(false)}
          onCancel={() => setShowCompose(false)}
        />
      )}
    </>
  )
}
