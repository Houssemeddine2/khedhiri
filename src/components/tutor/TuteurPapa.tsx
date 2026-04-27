'use client'

import { useState } from 'react'
import type { TutorSession } from '@/types/tutor'
import type { Membre } from '@/lib/membres'

interface TuteurPapaProps {
  sessions: TutorSession[]
  filles: Membre[]
  analyses: { user_id: string; matiere: string | null; sujets: string[]; difficulte: number | null; created_at: string }[]
  notes: { user_id: string; matiere: string; note: number; note_max: number; date: string }[]
  devoirs: { user_id: string; matiere: string; description: string; date_rendu: string; fait: boolean }[]
  absences: { user_id: string; date_debut: string; date_fin: string; justifiee: boolean; cours: string | null }[]
  observations: { user_id: string; prof: string | null; matiere: string | null; contenu: string; date: string }[]
  evenements: { user_id: string; titre: string; type: string; date_debut: string; date_fin: string | null }[]
}

function fmt(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

function isThisWeek(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= -7 && diff <= 0
}

function isUpcoming(iso: string, days = 7) {
  const d = new Date(iso)
  const now = new Date()
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= days
}

function isUrgent(iso: string) {
  return isUpcoming(iso, 2)
}

function noteEvolution(notes: TuteurPapaProps['notes'], userId: string, matiere: string): number | null {
  const ns = notes.filter(n => n.user_id === userId && n.matiere === matiere).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  if (ns.length < 2) return null
  return ns[0].note - ns[1].note
}

function getIntensiteEtoiles(count: number): string {
  if (count >= 4) return '★★★'
  if (count >= 2) return '★★'
  return '★'
}

export default function TuteurPapa({ sessions, filles, analyses, notes, devoirs, absences, observations, evenements }: TuteurPapaProps) {
  const [filleActive, setFilleActive] = useState(filles[0]?.id ?? '')
  const [syncEnCours, setSyncEnCours] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  async function handleSync() {
    setSyncEnCours(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/pronote/sync', { method: 'POST' })
      const data = await res.json() as { ok: boolean }
      setSyncMsg(data.ok ? '✓ Sync réussie — rechargez la page' : '✗ Erreur sync')
    } catch {
      setSyncMsg('✗ Erreur réseau')
    }
    setSyncEnCours(false)
  }

  const userId = filleActive
  const filleSessions = sessions.filter(s => s.user_id === userId)
  const filleAnalyses = analyses.filter(a => a.user_id === userId)
  const filleNotes = notes.filter(n => n.user_id === userId)
  const filleDevoirs = devoirs.filter(d => d.user_id === userId && !d.fait)
  const filleAbsences = absences.filter(a => a.user_id === userId && isThisWeek(a.date_debut))
  const filleObs = observations.filter(o => o.user_id === userId)
  const filleEvts = evenements.filter(e => e.user_id === userId && isUpcoming(e.date_debut))

  const sessionsSemaine = filleSessions.filter(s => isThisWeek(s.updated_at))
  const analysesSemaine = filleAnalyses.filter(a => isThisWeek(a.created_at))
  const matieresCounts: Record<string, number> = {}
  for (const a of analysesSemaine) {
    if (a.matiere) matieresCounts[a.matiere] = (matieresCounts[a.matiere] ?? 0) + 1
  }
  const dureeEstimeeMin = sessionsSemaine.length * 15

  const alertes: { couleur: string; label: string }[] = []
  if (filleAbsences.length) alertes.push({ couleur: 'bg-terracotta', label: `⚠️ ${filleAbsences.length} absence(s) cette semaine` })
  if (filleObs.length) alertes.push({ couleur: 'bg-gold', label: `📋 ${filleObs.length} observation(s) de prof` })
  if (filleEvts.filter(e => isUrgent(e.date_debut)).length) alertes.push({ couleur: 'bg-azur', label: `📅 Événement dans 48h` })

  const notesDernieres: Record<string, { note: number; noteMax: number; evol: number | null }> = {}
  const matieresVues = new Set<string>()
  for (const n of filleNotes) {
    if (!matieresVues.has(n.matiere)) {
      matieresVues.add(n.matiere)
      notesDernieres[n.matiere] = {
        note: n.note,
        noteMax: n.note_max,
        evol: noteEvolution(filleNotes, userId, n.matiere),
      }
    }
  }

  function couleurNote(note: number, max: number) {
    const ratio = note / max
    if (ratio >= 0.75) return 'text-olive font-bold'
    if (ratio >= 0.5) return 'text-gold font-bold'
    return 'text-terracotta font-bold'
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-fraunces text-2xl font-bold text-ink">Sid Ahmed</h1>
          <p className="font-manrope text-xs text-ink-soft">Tableau de bord Papa</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncEnCours}
          className="bg-olive text-white font-manrope text-xs px-3 py-1.5 rounded-xl disabled:opacity-50"
        >
          {syncEnCours ? '…' : '🔄 Sync Pronote'}
        </button>
      </div>
      {syncMsg && <p className="font-manrope text-xs text-center text-ink-soft">{syncMsg}</p>}

      {/* Tabs filles */}
      <div className="flex gap-2">
        {filles.map(f => (
          <button
            key={f.id}
            onClick={() => setFilleActive(f.id)}
            className={`px-4 py-1.5 rounded-full font-manrope font-semibold text-sm transition-colors ${
              filleActive === f.id ? 'bg-terracotta text-white' : 'bg-white border border-sand-warm text-ink-soft hover:border-terracotta/40'
            }`}
          >
            {f.nom}
          </button>
        ))}
      </div>

      {/* Section 1 — Alertes */}
      {alertes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alertes.map((a, i) => (
            <span key={i} className={`${a.couleur} text-white font-manrope text-xs px-3 py-1 rounded-full font-semibold`}>
              {a.label}
            </span>
          ))}
        </div>
      )}

      {/* Section 2 — Activité Sid Ahmed */}
      <div className="bg-white border border-sand-warm rounded-2xl p-4 space-y-3">
        <h2 className="font-fraunces font-bold text-ink text-sm">📚 Cette semaine avec Sid Ahmed</h2>
        <div className="flex gap-3">
          {[
            { val: sessionsSemaine.length, label: 'sessions', color: 'text-terracotta' },
            { val: `${dureeEstimeeMin}min`, label: 'durée', color: 'text-olive' },
            { val: Object.keys(matieresCounts).length, label: 'matières', color: 'text-azur' },
          ].map(({ val, label, color }) => (
            <div key={label} className="flex-1 bg-sand rounded-xl p-2 text-center">
              <p className={`font-fraunces text-lg font-bold ${color}`}>{val}</p>
              <p className="font-manrope text-xs text-ink-soft">{label}</p>
            </div>
          ))}
        </div>
        {Object.keys(matieresCounts).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(matieresCounts).map(([m, count]) => (
              <span key={m} className="bg-azur text-white font-manrope text-xs px-2.5 py-0.5 rounded-full">
                {m} {getIntensiteEtoiles(count)}
              </span>
            ))}
          </div>
        )}
        {sessionsSemaine.length === 0 && (
          <p className="font-manrope text-xs text-ink-soft italic">Aucune session cette semaine.</p>
        )}
      </div>

      {/* Section 3 — Notes Pronote */}
      <div className="bg-white border border-sand-warm rounded-2xl p-4 space-y-2">
        <h2 className="font-fraunces font-bold text-ink text-sm">🎓 Notes Pronote</h2>
        {Object.entries(notesDernieres).length === 0 ? (
          <p className="font-manrope text-xs text-ink-soft italic">Aucune note synchronisée. Configure Pronote ci-dessous.</p>
        ) : (
          Object.entries(notesDernieres).map(([mat, { note, noteMax, evol }]) => (
            <div key={mat} className={`flex items-center justify-between px-3 py-2 rounded-xl ${evol !== null && evol <= -2 ? 'bg-rose/20 border border-rose' : 'bg-sand'}`}>
              <span className="font-manrope text-sm text-ink">{mat}</span>
              <div className="flex items-center gap-2">
                <span className={`font-manrope text-sm ${couleurNote(note, noteMax)}`}>{note}/{noteMax}</span>
                {evol !== null && (
                  <span className={`font-manrope text-xs ${evol > 0 ? 'text-olive' : evol < 0 ? 'text-terracotta' : 'text-ink-soft'}`}>
                    {evol > 0 ? `↗ +${evol}` : evol < 0 ? `↘ ${evol}` : '→'}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Section 4 — Absences & Cours ratés */}
      <div className="bg-white border border-sand-warm rounded-2xl p-4 space-y-2">
        <h2 className="font-fraunces font-bold text-ink text-sm">🚪 Absences & Cours ratés</h2>
        {filleAbsences.length === 0 ? (
          <p className="font-manrope text-xs text-ink-soft italic">Aucune absence cette semaine. 🎉</p>
        ) : (
          filleAbsences.map((a, i) => (
            <div key={i} className="flex items-start gap-3 px-3 py-2 bg-rose/10 border-l-2 border-terracotta rounded-r-xl">
              <div className="min-w-[40px] font-manrope text-xs font-bold text-terracotta">{fmt(a.date_debut)}</div>
              <div className="flex-1">
                <p className="font-manrope text-sm text-ink">{a.cours ?? 'Cours inconnu'}</p>
                <p className="font-manrope text-xs text-ink-soft">{a.justifiee ? 'Justifiée' : 'Non justifiée'}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Section 5a — Observations des profs */}
      {filleObs.length > 0 && (
        <div className="bg-white border border-sand-warm rounded-2xl p-4 space-y-2">
          <h2 className="font-fraunces font-bold text-ink text-sm">📋 Observations des professeurs</h2>
          {filleObs.slice(0, 5).map((o, i) => (
            <div key={i} className="px-3 py-2 bg-sand rounded-xl border-l-2 border-olive space-y-0.5">
              <div className="flex justify-between">
                <span className="font-manrope text-xs font-bold text-olive">{o.prof ?? 'Prof'}{o.matiere ? ` — ${o.matiere}` : ''}</span>
                <span className="font-manrope text-xs text-ink-soft">{fmt(o.date)}</span>
              </div>
              <p className="font-manrope text-sm text-ink italic">&quot;{o.contenu}&quot;</p>
            </div>
          ))}
        </div>
      )}

      {/* Section 5b — Événements & Devoirs */}
      <div className="bg-white border border-sand-warm rounded-2xl p-4 space-y-2">
        <h2 className="font-fraunces font-bold text-ink text-sm">📅 Devoirs & Événements à venir</h2>
        {(() => {
          const items = [
            ...filleDevoirs.filter(d => isUpcoming(d.date_rendu, 14)).map(d => ({ ...d, _type: 'devoir' as const })),
            ...filleEvts.map(e => ({ ...e, _type: 'event' as const })),
          ].sort((a, b) => {
            const da = a._type === 'devoir' ? a.date_rendu : a.date_debut
            const db = b._type === 'devoir' ? b.date_rendu : b.date_debut
            return new Date(da).getTime() - new Date(db).getTime()
          }).slice(0, 8)

          if (items.length === 0) {
            return <p className="font-manrope text-xs text-ink-soft italic">Aucun devoir ou événement synchronisé.</p>
          }

          return items.map((item, i) => {
            const date = item._type === 'devoir' ? item.date_rendu : item.date_debut
            const titre = item._type === 'devoir' ? `${item.matiere} — ${item.description.slice(0, 50)}` : item.titre
            const urgent = isUrgent(date)
            const estPrepare = item._type === 'devoir' && filleAnalyses.some(a => a.matiere === item.matiere)
            return (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${urgent ? 'bg-rose/10 border border-rose/40' : 'bg-sand'}`}>
                <div className={`min-w-[40px] font-manrope text-xs font-bold text-center ${urgent ? 'text-terracotta' : 'text-ink-soft'}`}>
                  {fmt(date)}
                </div>
                <p className="flex-1 font-manrope text-sm text-ink">{titre}</p>
                {urgent && <span className="font-manrope text-xs bg-terracotta text-white px-2 py-0.5 rounded-full">Bientôt !</span>}
                {item._type === 'devoir' && estPrepare && !urgent && <span className="font-manrope text-xs bg-olive text-white px-2 py-0.5 rounded-full">✓ Préparé</span>}
              </div>
            )
          })
        })()}
      </div>
    </main>
  )
}
