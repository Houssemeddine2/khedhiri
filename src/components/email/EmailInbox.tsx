'use client'

import { useState, useEffect, useCallback } from 'react'
import type { EmailMessage, EmailMessageDetail } from '@/types/email'
import EmailMessageView from './EmailMessage'
import EmailCompose from './EmailCompose'

interface EmailInboxProps {
  isPapa: boolean
}

const FOLDERS_PAPA = [
  { value: 'INBOX', label: 'Boîte de réception' },
  { value: 'Sent', label: 'Envoyés' },
  { value: 'Trash', label: 'Corbeille' },
]

export default function EmailInbox({ isPapa }: EmailInboxProps) {
  const [folder, setFolder] = useState('INBOX')
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<EmailMessageDetail | null>(null)
  const [isLoadingMessage, setIsLoadingMessage] = useState(false)
  const [showCompose, setShowCompose] = useState(false)

  const loadMessages = useCallback(async () => {
    setIsLoading(true)
    setErreur(null)
    try {
      const res = await fetch(`/api/email/messages?folder=${encodeURIComponent(folder)}&page=1`)
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erreur inconnue')
      }
      const data = await res.json() as { messages: EmailMessage[] }
      setMessages(data.messages)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [folder])

  useEffect(() => { loadMessages() }, [loadMessages])

  async function handleSelectMessage(uid: number) {
    setIsLoadingMessage(true)
    try {
      const res = await fetch(`/api/email/message/${uid}?folder=${encodeURIComponent(folder)}`)
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erreur')
      }
      const data = await res.json() as { message: EmailMessageDetail }
      setSelectedMessage(data.message)
      setMessages(prev => prev.map(m => m.uid === uid ? { ...m, seen: true } : m))
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setIsLoadingMessage(false)
    }
  }

  if (selectedMessage) {
    return (
      <EmailMessageView
        message={selectedMessage}
        isPapa={isPapa}
        folder={folder}
        onBack={() => setSelectedMessage(null)}
        onDeleted={() => { setSelectedMessage(null); loadMessages() }}
      />
    )
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-fraunces text-2xl font-bold text-ink">Ma boîte mail ✉️</h1>
          <button
            onClick={() => setShowCompose(true)}
            className="px-3 py-2 rounded-xl bg-terracotta text-white font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors"
          >
            + Nouveau
          </button>
        </div>

        {isPapa && (
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {FOLDERS_PAPA.map(f => (
              <button
                key={f.value}
                onClick={() => setFolder(f.value)}
                className={`px-3 py-1 rounded-full font-manrope text-xs font-semibold whitespace-nowrap transition-colors ${
                  folder === f.value
                    ? 'bg-terracotta text-white'
                    : 'bg-sand text-ink-soft hover:bg-sand-warm'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {isLoading && <p className="font-manrope text-sm text-ink-soft py-8 text-center">Chargement...</p>}
        {erreur && <p className="font-manrope text-sm text-red-600 py-4">{erreur}</p>}
        {!isLoading && !erreur && messages.length === 0 && (
          <p className="font-manrope text-sm text-ink-soft py-8 text-center italic">Aucun message.</p>
        )}

        <div className="space-y-2">
          {messages.map(msg => (
            <button
              key={msg.uid}
              onClick={() => handleSelectMessage(msg.uid)}
              disabled={isLoadingMessage}
              className={`w-full text-left rounded-xl p-3 transition-colors hover:bg-sand-warm disabled:opacity-50 ${
                msg.seen ? 'bg-white' : 'bg-jasmine border-l-4 border-terracotta'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`font-manrope text-sm ${msg.seen ? 'text-ink-soft' : 'text-ink font-semibold'}`}>
                  {msg.fromName || msg.from}
                </span>
                <span className="font-manrope text-xs text-ink-soft whitespace-nowrap">
                  {new Date(msg.date).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <p className={`font-manrope text-sm mt-0.5 ${msg.seen ? 'text-ink-soft' : 'text-ink'}`}>
                {msg.subject}
              </p>
            </button>
          ))}
        </div>
      </div>

      {showCompose && (
        <EmailCompose
          isPapa={isPapa}
          onSent={() => { setShowCompose(false); loadMessages() }}
          onCancel={() => setShowCompose(false)}
        />
      )}
    </>
  )
}
