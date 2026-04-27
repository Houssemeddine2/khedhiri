'use client'

import { useState } from 'react'
import { decrypt } from '@/lib/journal-crypto'
import CreerJournal from './CreerJournal'
import DeverrouillerJournal from './DeverrouillerJournal'
import JournalOuvert from './JournalOuvert'
import type { JournalProfil, JournalEntree, EntreeDechiffree } from '@/types/journal'

interface JournalClientProps {
  prenom: string
  profil: JournalProfil | null
  entreesChiffrees: JournalEntree[]
}

export default function JournalClient({ prenom, profil, entreesChiffrees }: JournalClientProps) {
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null)
  const [entreesDechiffrees, setEntreesDechiffrees] = useState<EntreeDechiffree[]>([])
  const [hasProfil, setHasProfil] = useState(!!profil)
  const [currentProfil, setCurrentProfil] = useState(profil)

  async function handleUnlocked(key: CryptoKey) {
    // Déchiffre toutes les entrées en mémoire
    const decrypted: EntreeDechiffree[] = []
    for (const e of entreesChiffrees) {
      try {
        const contenu = await decrypt(key, e.contenu_cipher)
        const titre   = e.titre_cipher ? await decrypt(key, e.titre_cipher) : ''
        decrypted.push({ id: e.id, titre, contenu, date: e.date, created_at: e.created_at })
      } catch {
        // entrée corrompue ou mdp erroné — ne devrait pas arriver après verifyKey
      }
    }
    decrypted.sort((a, b) => b.date.localeCompare(a.date))
    setEntreesDechiffrees(decrypted)
    setCryptoKey(key)
  }

  // Après création du profil → rechargement de la page pour récupérer le profil depuis Supabase
  function handleCreated() {
    window.location.reload()
  }

  if (!hasProfil || !currentProfil) {
    return <CreerJournal prenom={prenom} onCreated={handleCreated} />
  }

  if (!cryptoKey) {
    return (
      <DeverrouillerJournal
        prenom={prenom}
        salt={currentProfil.salt}
        checkCipher={currentProfil.check_cipher}
        indice={currentProfil.indice}
        onUnlocked={handleUnlocked}
      />
    )
  }

  return (
    <JournalOuvert
      cryptoKey={cryptoKey}
      entrees={entreesDechiffrees}
      prenom={prenom}
      onLock={() => setCryptoKey(null)}
    />
  )
}
