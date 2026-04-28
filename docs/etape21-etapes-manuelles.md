# Étape 21 — Étapes manuelles consolidées

> Toutes les actions qui ne peuvent pas être automatisées par le code et qui doivent être faites dans le Dashboard Supabase ou ailleurs.
> À faire **dans l'ordre** si tu pars d'une base vierge.

---

## Dashboard Supabase → SQL Editor

Exécuter chaque fichier dans l'ordre. Coller le contenu dans SQL Editor → Run.

| Ordre | Fichier | Tables créées |
|-------|---------|---------------|
| 1 | `supabase/etape3-schema.sql` | `posts`, `reactions`, `profiles`, `vocal_messages` ; bucket `vocaux` |
| 2 | `supabase/etape4-schema.sql` | `conversations`, `messages` ; bucket `chat-media` |
| 3 | `supabase/etape5-schema.sql` | `push_subscriptions` |
| 4 | `supabase/etape6-schema.sql` | `photos`, `creations` ; buckets `photos`, `creations` |
| 5 | `supabase/etape7-schema.sql` | `evenements` |
| 6 | `supabase/etape8-schema.sql` | colonnes `avatar_url`, `couleur` sur `profiles` ; bucket `avatars` |
| 7 | `supabase/etape10-schema.sql` | `journal_profils`, `journal_entrees` |
| 8 | `supabase/etape11v2-schema.sql` | `tutor_sessions`, `tutor_messages` |
| 9 | `supabase/etape13-schema.sql` | `email_credentials` |
| 10 | `supabase/etape14-schema.sql` | `lettres` |
| 11 | `supabase/etape15-schema.sql` | `vocaux`, `calins` |
| 12 | `supabase/etape16-schema.sql` | `defis`, `reponses_defis` |
| 13 | `supabase/etape17-schema.sql` | `lectures`, `avancement_lecture`, `questions_lecture`, `reponses_questions` |

---

## Dashboard Supabase → Storage → Buckets

Créer les buckets manquants si absents. La colonne "Public" indique si le bucket doit être en accès public.

| Bucket | Public | Étape | Usage |
|--------|--------|-------|-------|
| `vocaux` | Non (privé) | 3 | Messages vocaux de la timeline |
| `chat-media` | Non (privé) | 4 | Photos et audios des chats |
| `photos` | Oui | 6 | Album photos familial |
| `creations` | Oui | 6 | Dessins de Sarah |
| `avatars` | Oui | 8 | Photos de profil |
| `calins` | Non (privé) | 15 | Fichiers audio des câlins vocaux |
| `defis` | Oui | 16 | Photos de réponses aux défis |

Pour créer un bucket : Storage → New bucket → entrer le nom → cocher "Public bucket" si indiqué → Save.

---

## Variables d'environnement Vercel

Aller sur [vercel.com/dashboard](https://vercel.com/dashboard) → projet khedhiri → Settings → Environment Variables.

| Variable | Valeur | Requis pour |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Tout |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon Supabase | Tout |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase | API routes élevées |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clé VAPID publique | Notifications push (étape 5) |
| `VAPID_PRIVATE_KEY` | Clé VAPID privée | Notifications push (étape 5) |
| `VAPID_SUBJECT` | `mailto:houssem@khedhiri.me` | Notifications push (étape 5) |
| `EMAIL_ENCRYPTION_KEY` | Clé hex 32 bytes | Client email (étape 13) |
| `EMAIL_HMAC_KEY` | Clé hex 32 bytes | Client email (étape 13) |
| `TUTOR_ENDPOINT` | URL Cloudflare Tunnel + `/api/chat` | Tuteur IA (étape 11) |
| `TUTOR_MODEL` | ex: `gemma2:12b` | Tuteur IA (étape 11) |
| `CRON_SECRET` | Chaîne aléatoire | Cron lettres 18 ans (étape 14) |

---

## Supabase → Realtime

Vérifier que les tables suivantes sont bien dans la publication `supabase_realtime` :

- `posts` (étape 3)
- `reactions` (étape 3)
- `messages` (étape 4)
- `defis` (étape 16)
- `calins` (étape 15)

Aller dans : Database → Replication → `supabase_realtime` → vérifier la liste des tables.

---

## Cron Vercel (étape 14 — Lettres 18 ans)

Dans `vercel.json` à la racine, vérifier que le cron est déclaré :

```json
{
  "crons": [
    {
      "path": "/api/lettres/cron",
      "schedule": "0 7 * * *"
    }
  ]
}
```

---

## Cloudflare Tunnel (étape 11 — Tuteur IA)

Sur le PC de Lisbonne :
1. Cloudflare Tunnel doit être actif et pointer vers `http://localhost:11434`
2. Ollama doit tourner avec le modèle chargé : `ollama run gemma2:12b`
3. L'URL du tunnel doit être dans `TUTOR_ENDPOINT` sur Vercel

---

*Dernière mise à jour : Avril 2026 — après étape 17*
