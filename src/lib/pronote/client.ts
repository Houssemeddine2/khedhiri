// src/lib/pronote/client.ts
// Wrapper autour de la bibliothèque pawnote (API Pronote non officielle)
// Architecture : session fonctionnelle — createSessionHandle + loginCredentials + appels individuels

import type {
  Grade,
  Assignment,
  NotebookAbsence,
  NotebookObservation,
  NewsInformation,
  NewsSurvey,
  Period,
} from 'pawnote'
import type { PronoteDonnees } from './types'

/**
 * Récupère toutes les données scolaires d'un élève depuis Pronote.
 *
 * @param url        - URL complète de l'instance Pronote (ex: https://0123456a.index-education.net/pronote/eleve.html)
 * @param username   - Identifiant de connexion Pronote
 * @param password   - Mot de passe Pronote
 * @returns          PronoteDonnees — notes, devoirs, absences, observations, événements
 */
export async function fetchPronoteDonnees(
  url: string,
  username: string,
  password: string,
): Promise<PronoteDonnees> {
  // Import dynamique pour éviter le bundling côté client
  const pawnote = await import('pawnote')

  const now = new Date()
  const dans30j = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // --- 1. Création de la session et authentification ---
  const session = pawnote.createSessionHandle()
  const deviceUUID = crypto.randomUUID()

  await pawnote.loginCredentials(session, {
    url,
    username,
    password,
    kind: pawnote.AccountKind.STUDENT,
    deviceUUID,
  })

  // --- 2. Détermination de la période courante ---
  // Les fonctions gradesOverview et notebook nécessitent un objet Period.
  // On prend la première période disponible dans les onglets Notes.
  const gradesTab = session.userResource.tabs.get(pawnote.TabLocation.Grades)
  const notebookTab = session.userResource.tabs.get(pawnote.TabLocation.Notebook)

  const currentPeriod: Period | undefined =
    gradesTab?.defaultPeriod ?? gradesTab?.periods[0]

  const notebookPeriod: Period | undefined =
    notebookTab?.defaultPeriod ?? notebookTab?.periods[0] ?? currentPeriod

  // --- 3. Notes (nécessite une période) ---
  let rawNotes: Grade[] = []
  if (currentPeriod) {
    try {
      const gradeOverview = await pawnote.gradesOverview(session, currentPeriod)
      rawNotes = gradeOverview.grades ?? []
    } catch { /* pas de notes disponibles */ }
  }

  // --- 4. Devoirs des 30 prochains jours ---
  let rawDevoirs: Assignment[] = []
  try {
    rawDevoirs = await pawnote.assignmentsFromIntervals(session, now, dans30j) ?? []
  } catch { /* pas de devoirs */ }

  // --- 5. Carnet de liaison : absences + observations ---
  let rawAbsences: NotebookAbsence[] = []
  let rawObs: NotebookObservation[] = []
  if (notebookPeriod) {
    try {
      const carnet = await pawnote.notebook(session, notebookPeriod)
      rawAbsences = carnet.absences ?? []
      rawObs = carnet.observations ?? []
    } catch { /* carnet inaccessible */ }
  }

  // --- 6. Actualités / événements ---
  let rawNews: Array<NewsInformation | NewsSurvey> = []
  try {
    const newsData = await pawnote.news(session)
    rawNews = newsData.items ?? []
  } catch { /* pas d'actualités */ }

  // --- 7. Mapping vers PronoteDonnees ---
  return {
    notes: rawNotes.map((n) => ({
      matiere: n.subject.name ?? 'Inconnu',
      // GradeValue.points contient la valeur numérique ; kind !== Grade signifie absent/exempté/etc.
      note: n.value.kind === pawnote.GradeKind.Grade ? n.value.points : 0,
      noteMax: n.outOf.kind === pawnote.GradeKind.Grade ? n.outOf.points : 20,
      date: toISODate(n.date),
      commentaire: n.comment || undefined,
    })),

    devoirs: rawDevoirs.map((d) => ({
      matiere: d.subject.name ?? 'Inconnu',
      description: d.description ?? '',
      dateRendu: toISODate(d.deadline),
      fait: d.done ?? false,
    })),

    absences: rawAbsences.map((a) => ({
      dateDebut: toISO(a.startDate),
      dateFin: toISO(a.endDate),
      justifiee: a.justified ?? false,
      cours: a.reason ?? undefined,
    })),

    observations: rawObs.map((o) => ({
      prof: undefined, // NotebookObservation n'expose pas directement le nom du prof
      matiere: o.subject?.name ?? undefined,
      contenu: o.name ?? '',
      date: toISODate(o.date),
    })),

    evenements: rawNews.map((e) => ({
      titre: e.title ?? 'Actualité',
      type: categoriseEvenement(e.title ?? ''),
      dateDebut: toISO(e.startDate),
      dateFin: e.endDate ? toISO(e.endDate) : undefined,
    })),
  }
}

// --- Utilitaires ---

function toISODate(d: Date | string): string {
  return new Date(d).toISOString().split('T')[0]
}

function toISO(d: Date | string): string {
  return new Date(d).toISOString()
}

function categoriseEvenement(titre: string): 'controle' | 'sortie' | 'reunion' | 'autre' {
  const t = titre.toLowerCase()
  if (t.includes('contrôle') || t.includes('devoir') || t.includes('évaluation') || t.includes('controle')) return 'controle'
  if (t.includes('sortie') || t.includes('voyage') || t.includes('visite')) return 'sortie'
  if (t.includes('réunion') || t.includes('reunion') || t.includes('parents') || t.includes('conseil')) return 'reunion'
  return 'autre'
}
