# Étape 15 — Câlin virtuel + messages vocaux préenregistrés

## Contexte

Chacun des 3 membres (Papa, Sandra, Sarah) peut envoyer un câlin vocal à un autre membre. Le câlin déclenche une notification push + un event Realtime Supabase. Le destinataire ouvre la page /câlin et écoute le message vocal.

Chaque membre prépare à l'avance une bibliothèque de vocaux titrés ("Bonne nuit", "Je t'aime"…). Au moment d'envoyer, il choisit un vocal de sa bibliothèque ou en enregistre un nouveau sur le moment (avec option de le sauvegarder).

## Architecture

```
[Expéditeur enregistre vocal] → [Supabase Storage bucket "calins"]
                                        ↓
[POST /api/calins] → [INSERT calins] → [Push notif destinataire]
                                        ↓
                              [Realtime subscription] → [Badge NavBar pulse]
```

## Base de données

```sql
-- Bibliothèque de vocaux préparés
CREATE TABLE vocaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  vocal_url TEXT NOT NULL,
  duree_sec INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vocaux ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriétaire gère ses vocaux"
  ON vocaux FOR ALL
  USING (auth.uid() = proprietaire_id)
  WITH CHECK (auth.uid() = proprietaire_id);

-- Câlins envoyés
CREATE TABLE calins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediteur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destinataire_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vocal_url TEXT NOT NULL,
  titre TEXT NOT NULL,
  envoye_at TIMESTAMPTZ DEFAULT now(),
  ecoute_at TIMESTAMPTZ NULL
);

ALTER TABLE calins ENABLE ROW LEVEL SECURITY;

-- Expéditeur voit ses envois
CREATE POLICY "Expéditeur voit ses câlins envoyés"
  ON calins FOR SELECT
  USING (auth.uid() = expediteur_id);

-- Destinataire voit ses câlins reçus
CREATE POLICY "Destinataire voit ses câlins reçus"
  ON calins FOR SELECT
  USING (auth.uid() = destinataire_id);

-- INSERT via route API (service role) uniquement
-- UPDATE ecoute_at via service role uniquement (même pattern que lue_at des lettres)
```

**Bucket Storage :** `calins` (privé). Accès via signed URL générée côté serveur (durée 30 min).

**Règles métier :**
- `vocal_url` dans `calins` est une copie au moment de l'envoi (indépendante de la bibliothèque — supprimer un vocal de la bibliothèque ne casse pas les câlins déjà envoyés)
- `ecoute_at` mis à jour côté serveur via service role, pas via RLS UPDATE (même pattern que `lue_at` dans `lettres`)
- On ne peut pas s'envoyer un câlin à soi-même (validé côté API)

## API Routes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/calins/vocaux` | GET | Liste ses propres vocaux (avec signed URL) |
| `/api/calins/vocaux` | POST | Upload un vocal dans sa bibliothèque (multipart/form-data : `audio`, `titre`, `duree_sec?`) |
| `/api/calins/vocaux/[id]` | DELETE | Supprime un vocal de sa bibliothèque |
| `/api/calins` | GET | Liste les câlins reçus (avec signed URL, triés par `envoye_at DESC`) |
| `/api/calins` | POST | Envoie un câlin |

### POST `/api/calins`

Accepte `multipart/form-data` avec :
- `destinataire_id` (UUID, doit être un membre valide, différent de l'expéditeur)
- `titre` (string non vide)
- `vocal_id` (UUID, vocal de bibliothèque existant) **OU** `audio` (fichier WebM/Opus brut)
- `sauvegarder` (boolean optionnel — si `audio` fourni, sauvegarde dans la bibliothèque)

Traitement :
1. Valide `destinataire_id` ∈ MEMBRES_IDS, ≠ `expediteur_id`
2. Si `vocal_id` : récupère `vocal_url` de la bibliothèque (vérifie `proprietaire_id = user.id`)
3. Si `audio` : upload dans `calins/[destinataire_id]/[uuid].webm`
4. Si `sauvegarder = true` : insert dans `vocaux` aussi
5. Insert dans `calins` via service role
6. Appelle `sendNotificationToUsers([destinataire_id], { title: "🤗 Câlin de [prénom]", body: titre })`
7. Retourne `{ id, vocal_url_signed }`

### GET `/api/calins`

Retourne les câlins reçus avec signed URL (30 min). Marque `ecoute_at = now()` pour les câlins dont `ecoute_at IS NULL` ET dont le destinataire vient de les charger — **non**, `ecoute_at` est mis à jour explicitement quand l'utilisateur clique "Écouter" (GET `/api/calins/[id]/ecouter`).

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/calins/[id]/ecouter` | POST | Marque `ecoute_at = now()` (service role, guard `.is('ecoute_at', null)`) |

## Pages et composants

### Page `/calin` (Server Component)
- Auth requise, redirige vers `/login` sinon
- Charge les câlins reçus via service role (pas de contenu sensible, juste les métadonnées)
- Rend `CâlinPage` (Client Component) qui gère Realtime

### `CâlinPage` (Client Component)
Trois sections :

**1. "Envoyer un câlin"**
- Sélecteur de destinataire : avatars des 2 autres membres
- Liste des vocaux de sa bibliothèque (fetch GET `/api/calins/vocaux`) — clic = sélection
- Bouton "Enregistrer un nouveau" → `VocalRecorder` inline (réutilise le pattern de `src/components/tutor/VocalButton.tsx`)
- Si enregistrement : champ titre + checkbox "Sauvegarder dans ma bibliothèque"
- Bouton "Envoyer le câlin 🤗" (disabled si pas de vocal + pas de destinataire)
- Animation cœur au clic (CSS keyframe, disparaît après 1s)

**2. "Ma bibliothèque de vocaux"**
- Liste des vocaux : titre + durée + bouton ▶ (VoicePlayer inline) + bouton 🗑️
- Bouton "Ajouter un vocal" : ouvre `VocalRecorder` + champ titre → POST `/api/calins/vocaux`

**3. "Câlins reçus"**
- Triés par `envoye_at DESC`
- Carte : avatar expéditeur + titre + date relative + badge "Nouveau !" si `ecoute_at null`
- Bouton "Écouter" → `VoicePlayer` inline + POST `/api/calins/[id]/ecouter`
- Rafraîchissement Realtime : abonnement channel `calins:destinataire_id=eq.[userId]` — INSERT → ajoute la carte en tête + pulse badge NavBar

### `CâlinRealtimeListener` (Client Component)
Encapsule la subscription Supabase Realtime. Quand INSERT reçu :
- Fetch signed URL du nouveau câlin
- Prépend à la liste locale
- Appelle `onNewCalin()` callback pour pulser le badge

### NavBar (modifié)
- Nouvelle icône câlin (cœur) entre Lettres et Journal
- Badge rouge si au moins un câlin non écouté (`ecoute_at IS NULL`)
- Papa voit le badge aussi

## Realtime

Channel : `calins` avec filtre `destinataire_id=eq.[userId]`.

```typescript
supabase
  .channel('calins-recus')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'calins',
    filter: `destinataire_id=eq.${userId}`
  }, handleNewCalin)
  .subscribe()
```

Requiert que Realtime soit activé sur la table `calins` dans Supabase Dashboard.

## Notification push

Texte : `"🤗 [Prénom] t'envoie un câlin !"` + titre du vocal en corps.
Utilise `sendNotificationToUsers` de `src/lib/push-server.ts` (même mécanisme que étapes 5 et 14).

## Variables d'environnement

Aucune nouvelle variable nécessaire — `SUPABASE_SERVICE_ROLE_KEY` et `VAPID_*` existent déjà.

## Fonctionnalités par rôle

| Fonctionnalité | Papa | Sandra | Sarah |
|---|---|---|---|
| Envoyer un câlin | ✅ | ✅ | ✅ |
| Gérer sa bibliothèque de vocaux | ✅ | ✅ | ✅ |
| Recevoir un câlin + notif push | ✅ | ✅ | ✅ |
| Badge NavBar câlins non écoutés | ✅ | ✅ | ✅ |

## Contraintes

- Taille max des fichiers audio : 5 Mo (validée côté API)
- Format accepté : WebM/Opus (produit nativement par MediaRecorder sur mobile et desktop)
- Durée max enregistrement : 60 secondes (enforced côté client via timer)
- `vocal_url` dans `calins` est une copie indépendante — suppression de bibliothèque sans impact
- `ecoute_at` toujours mis à jour via service role (pas de RLS UPDATE pour les destinataires)
- On ne peut pas s'envoyer un câlin à soi-même
