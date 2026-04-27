# Sid Ahmed v2 — Design Spec

**Date** : 27 avril 2026
**Projet** : khedhiri.me
**Scope** : Améliorations du tuteur IA (étape 11) — mode vocal, Pronote, progression, dashboard Papa, notification serveur

---

## Contexte

Sid Ahmed (tuteur IA en hommage aux deux grands-pères Ahmed) est déjà codé et déployé (étape 11). Il tourne sur Ollama local à Lisbonne, exposé via Cloudflare Tunnel. Le PC est prêt, les tests viendront après l'étape 20. Ce document spécifie les améliorations à apporter avant finalisation.

**Stack existante à étendre :**
- `/api/tutor`, `/api/tutor/session`, `/api/tutor/historique`
- `src/lib/tutor/` (OllamaProvider / UnavailableProvider)
- `src/components/tutor/` (TuteurChat, TuteurBubble, TuteurPapa, TuteurWidget)
- `push_subscriptions` + `web-push` + `push-server.ts` (push déjà en place)

---

## 1. Mode vocal — Push-to-talk

### Interface

- La barre de texte est remplacée par un grand bouton terracotta **"Maintiens pour parler"**
- Maintenir le bouton → enregistrement (SpeechRecognition API)
- Relâcher → envoi du message transcrit
- La réponse de Sid Ahmed est **lue automatiquement** (SpeechSynthesis API) avec un mini player audio inline (▶ + barre de progression + durée)
- Un bouton ⌨️ en bas à droite bascule en mode texte classique (et vice versa)
- Le mode choisi est mémorisé dans `localStorage`

### Technique

- **Entrée** : `window.SpeechRecognition` / `window.webkitSpeechRecognition` — 100% navigateur, aucune donnée audio ne quitte le téléphone
- **Sortie** : `window.speechSynthesis.speak()` — voix masculine française (`lang: 'fr-FR'`, `voiceURI` préférant une voix masculine si disponible)
- **Arabe** : si la session concerne l'arabe (détecté dans le system prompt), `lang` bascule sur `ar-SA`
- **Fallback** : si SpeechRecognition non disponible (Firefox) → le bouton micro est caché, seul le mode texte est disponible, un message discret explique pourquoi
- **TuteurWidget** : même logique push-to-talk dans le mini-chat flottant

### Composants touchés

- `TuteurChat.tsx` — ajout états `modeVocal`, `enregistrement`, logique SpeechRecognition/Synthesis
- `TuteurWidget.tsx` — même ajout allégé
- `TuteurBubble.tsx` — ajout player audio pour les messages assistant

---

## 2. Intégration Pronote

### Bibliothèque

`pawnote` (npm, TypeScript, maintenue activement) — wrapper de l'API non-officielle Pronote.

### Données récupérées (par fille)

| Donnée | Table Supabase | Colonnes clés |
|--------|---------------|---------------|
| Notes | `pronote_notes` | `matiere`, `note`, `note_max`, `date`, `commentaire` |
| Devoirs | `pronote_devoirs` | `matiere`, `description`, `date_rendu`, `fait` |
| Absences | `pronote_absences` | `date_debut`, `date_fin`, `justifiee`, `cours` |
| Observations | `pronote_observations` | `prof`, `matiere`, `contenu`, `date` |
| Événements | `pronote_evenements` | `titre`, `type`, `date_debut`, `date_fin` |

Toutes les tables ont `user_id` + `synced_at`. RLS : seul Papa (admin) + la fille concernée peuvent lire.

### Credentials Pronote

- Colonne `pronote_url TEXT`, `pronote_username TEXT`, `pronote_password_encrypted TEXT` dans la table `profiles`
- Chiffrement AES-GCM côté serveur avec `PRONOTE_ENCRYPTION_KEY` (variable d'env Vercel)
- Papa saisit les credentials une fois depuis `/tuteur` (formulaire dédié)

### Sync

- **Automatique** : cron Vercel (`vercel.json` → `crons`) toutes les heures → `/api/pronote/sync`
- **Manuelle** : bouton "🔄 Sync" dans le dashboard Papa → même route
- La route sync toutes les deux filles en parallèle (`Promise.all`)

### Utilisation par Sid Ahmed

Le system prompt dans `prompts.ts` est enrichi dynamiquement avec :
```
[CONTEXTE PRONOTE — AUJOURD'HUI]
- Cours raté lundi : Maths (2h) → à rattraper si possible
- Devoir dû demain : Contrôle Histoire-Géo
- Note récente en baisse : Histoire 9/20 (était 12)
```
Sid Ahmed oriente la session naturellement ET annonce proactivement : *"Sandra, tu as un contrôle Histoire-Géo demain, tu veux qu'on révise ?"*

---

## 3. Suivi de progression

### Analyse par Ollama

Après chaque session (au `POST /api/tutor` final ou via un job déclenché 5 min après la dernière activité) :
- Ollama reçoit le résumé de la session + un prompt court : *"Résume en JSON : matière principale, sujets abordés, niveau de difficulté (1-3), points forts, points à retravailler"*
- Réponse stockée dans table `tutor_analyses` : `session_id`, `matiere`, `sujets[]`, `difficulte`, `points_forts`, `points_retravailler`

### Agrégation hebdomadaire

Vue calculée (ou requête Supabase) : pour chaque fille, par semaine → matières travaillées + nombre de sessions + durée totale + intensité (★ = 1 session, ★★ = 2-3, ★★★ = 4+).

---

## 4. Tableau de bord Papa (5 sections)

Page `/tuteur` pour Houssem, avec onglets Sandra / Sarah.

### Section 1 — Alertes rapides
Badges colorés en haut de page générés automatiquement :
- Rouge `⚠️ N absences cette semaine`
- Orange `📋 N observations de profs`
- Bleu `📅 Événement scolaire à venir`

### Section 2 — Activité Sid Ahmed
Stats de la semaine : nombre de sessions, durée totale, matières avec intensité ★.

### Section 3 — Notes Pronote
Liste toutes les matières avec note actuelle + flèche d'évolution (`↗ +2`, `→`, `↘ −3`). Encadré rouge si baisse ≥ 2 points sur la dernière note.

### Section 4 — Absences & Cours ratés
Liste chronologique avec type (absence / retard), justification, cours manqué. Suggestion automatique : *"Sid Ahmed peut rattraper ce cours avec Sandra"*.

### Section 5 — Observations des profs + Événements
Observations Pronote en carte avec nom du prof, matière, date. Événements (contrôles, sorties, réunions) avec badge urgence si dans les 48h.

---

## 5. Notification Papa — "Sid Ahmed dort"

### Déclencheur
Quand une fille envoie son **premier message** d'une session et qu'Ollama répond avec `UnavailableProvider` (timeout 3s sur `/api/tags`).

### Notification push reçue par Papa
> **📚 Sandra veut travailler avec Sid Ahmed**
> Elle attend — allume le serveur à Lisbonne !

### Garde-fou anti-spam
Colonne `last_tutor_unavail_notif_at TIMESTAMPTZ` dans `profiles` (ligne Papa). Si la dernière notification date de moins d'1 heure → pas de nouvelle notification.

### Technique
Dans `/api/tutor/route.ts`, après détection indisponibilité Ollama :
1. Récupérer `push_subscriptions` de Papa (user_id fixe dans `lib/membres.ts`)
2. Vérifier `last_tutor_unavail_notif_at` — si > 1h ou null → envoyer
3. `webpush.sendNotification()` via `push-server.ts` existant
4. Mettre à jour `last_tutor_unavail_notif_at`

---

## Nouvelles variables d'environnement requises

```
PRONOTE_ENCRYPTION_KEY=    # clé AES-256 pour chiffrer les credentials Pronote
```

## Nouvelles migrations Supabase requises

- `etape11v2` : tables `pronote_notes`, `pronote_devoirs`, `pronote_absences`, `pronote_observations`, `pronote_evenements`, `tutor_analyses` + colonnes Pronote dans `profiles` + colonne `last_tutor_unavail_notif_at` dans `profiles`

---

## Ce qui ne change pas

- Architecture Ollama / Cloudflare Tunnel
- Abstraction provider (local/Claude/Mistral)
- Journaux intimes (non liés)
- Garde-fous enfants dans les prompts
- Nom : Sid Ahmed, tuteur masculin

---

*Avec tout l'amour possible, pour Sandra et Sarah. ♡*
