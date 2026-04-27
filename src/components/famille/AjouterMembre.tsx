'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadPhotoMembre, ajouterMembre } from '@/app/actions/famille'

interface AjouterMembreProps {
  onClose: () => void
}

export default function AjouterMembre({ onClose }: AjouterMembreProps) {
  const router = useRouter()
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [surnom, setSurnom] = useState('')
  const [relation, setRelation] = useState('')
  const [cote, setCote] = useState<'khedhiri' | 'maternel'>('khedhiri')
  const [generation, setGeneration] = useState(1)
  const [dateNaissance, setDateNaissance] = useState('')
  const [lieuNaissance, setLieuNaissance] = useState('')
  const [bio, setBio] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prenom.trim()) { setErreur('Le prénom est obligatoire.'); return }
    if (!relation.trim()) { setErreur('La relation est obligatoire.'); return }
    setErreur(null)
    setIsPending(true)

    try {
      let photoUrl: string | undefined
      if (photoFile) {
        const fd = new FormData(); fd.append('file', photoFile)
        photoUrl = await uploadPhotoMembre(fd)
      }
      await ajouterMembre({
        prenom, nom: nom || undefined, surnom: surnom || undefined,
        photoUrl, dateNaissance: dateNaissance || undefined,
        lieuNaissance: lieuNaissance || undefined,
        cote, relation, generation, bio: bio || undefined,
      })
      router.refresh()
      onClose()
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
      setIsPending(false)
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-fraunces text-xl font-bold text-ink">Ajouter un membre</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-2xl" aria-label="Fermer">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="prenom">Prénom *</label>
              <input id="prenom" type="text" value={prenom} onChange={e => setPrenom(e.target.value)}
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta" required />
            </div>
            <div>
              <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="nom">Nom</label>
              <input id="nom" type="text" value={nom} onChange={e => setNom(e.target.value)}
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta" />
            </div>
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="surnom">Surnom (ex: "Jid Ahmed", "Tata Fatma")</label>
            <input id="surnom" type="text" value={surnom} onChange={e => setSurnom(e.target.value)}
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta" />
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="relation">Relation *</label>
            <input id="relation" type="text" value={relation} onChange={e => setRelation(e.target.value)}
              placeholder="Ex: Grand-père paternel, Tante maternelle..."
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="cote">Côté</label>
              <select id="cote" value={cote} onChange={e => setCote(e.target.value as 'khedhiri' | 'maternel')}
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta">
                <option value="khedhiri">Côté Papa (Khedhiri)</option>
                <option value="maternel">Côté Maternel</option>
              </select>
            </div>
            <div>
              <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="generation">Génération</label>
              <select id="generation" value={generation} onChange={e => setGeneration(Number(e.target.value))}
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta">
                <option value={0}>Arrière-grands-parents</option>
                <option value={1}>Grands-parents</option>
                <option value={2}>Parents / Oncles / Tantes</option>
                <option value={3}>Nous (Sandra, Sarah, Papa)</option>
                <option value={4}>Cousins / Cousines</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="date-naissance">Date de naissance</label>
              <input id="date-naissance" type="date" value={dateNaissance} onChange={e => setDateNaissance(e.target.value)}
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta" />
            </div>
            <div>
              <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="lieu">Lieu de naissance</label>
              <input id="lieu" type="text" value={lieuNaissance} onChange={e => setLieuNaissance(e.target.value)}
                placeholder="Ex: Tunis, Lisbonne..."
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta" />
            </div>
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="bio">Bio / Histoire</label>
            <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="Quelques mots sur cette personne..."
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta resize-none" />
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="photo-membre">Photo (optionnel)</label>
            <input id="photo-membre" type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
              className="w-full font-manrope text-sm text-ink" />
          </div>

          {erreur && <p className="font-manrope text-sm text-red-600">{erreur}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-sand-warm font-manrope text-sm text-ink-soft hover:bg-sand transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2 rounded-xl bg-terracotta text-white font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors disabled:opacity-50">
              {isPending ? 'Ajout...' : 'Ajouter 🌳'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
