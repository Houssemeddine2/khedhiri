# Étape 14 — Lettres pour leurs 18 ans

## Contexte

Papa (Houssem) écrit des lettres à Sandra et Sarah, verrouillées jusqu'à une date choisie. Les filles voient qu'une lettre les attend avec un compte à rebours, mais pas le contenu. Le jour du déverrouillage, elles reçoivent une notification push et peuvent lire la lettre.

## Architecture

```
[Papa écrit] → [Supabase DB lettres] → [API route vérifie unlock_at] → [Fille lit]
                                              ↕
                                    [Vercel Cron 8h/jour]
                                    (notif push si déverrouillée)
```

Le verrou est côté serveur : l'API route ne renvoie jamais le `contenu` si `unlock_at > now()`. Le contenu est stocké en clair dans Supabase mais inaccessible au navigateur tant que la date n'est pas atteinte.

## Base de données

```sql
CREATE TABLE lettres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destinataire_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  unlock_at TIMESTAMPTZ NOT NULL,
  notif_envoyee BOOLEAN NOT NULL DEFAULT false,
  lue_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lettres ENABLE ROW LEVEL SECURITY;

-- Papa voit toutes ses lettres écrites
CREATE POLICY "Auteur voit ses lettres"
  ON lettres FOR ALL
  USING (auth.uid() = auteur_id)
  WITH CHECK (auth.uid() = auteur_id);

-- Les filles voient leurs lettres (métadonnées + contenu si déverrouillé)
-- Le filtrage du contenu est géré côté API route, pas ici
CREATE POLICY "Destinataire voit ses lettres"
  ON lettres FOR SELECT
  USING (auth.uid() = destinataire_id);

-- Les filles peuvent marquer une lettre comme lue (UPDATE lue_at uniquement)
CREATE POLICY "Destinataire peut marquer comme lue"
  ON lettres FOR UPDATE
  USING (auth.uid() = destinataire_id)
  WITH CHECK (auth.uid() = destinataire_id);
```

**Règles métier :**
- `unlock_at` est fixé à la création et **jamais modifiable** après
- Papa peut modifier `titre` et `contenu` librement (via UPDATE auteur_id)
- `lue_at` est null jusqu'au premier clic "Lire" — l'API le remplit au moment de la lecture

## API Routes

| Route | Méthode | Acteur | Description |
|-------|---------|--------|-------------|
| `/api/lettres` | GET | Papa | Liste toutes ses lettres avec statut |
| `/api/lettres` | POST | Papa | Crée une lettre |
| `/api/lettres/[id]` | GET | Fille | Métadonnées + contenu si déverrouillé, marque lue_at |
| `/api/lettres/[id]` | PATCH | Papa | Modifie titre et/ou contenu (pas unlock_at) |
| `/api/lettres/[id]` | DELETE | Papa | Supprime une lettre |
| `/api/lettres/cron` | POST | Cron Vercel | Envoie notifs pour lettres déverrouillées non notifiées |

La route GET `/api/lettres/[id]` côté fille :
- Retourne `{ id, titre, unlock_at, lue_at }` si verrouillée
- Retourne `{ id, titre, contenu, unlock_at, lue_at, created_at }` si déverrouillée
- Met à jour `lue_at = now()` si déverrouillée et `lue_at` est null (premier accès)

La route PATCH `/api/lettres/[id]` :
- Accepte uniquement `{ titre?, contenu? }` — rejette tout champ `unlock_at`

La route `/api/lettres/cron` :
- Sécurisée par `Authorization: Bearer CRON_SECRET` (variable d'env Vercel)
- Cherche `unlock_at <= now() AND notif_envoyee = false`
- Envoie push notification à la destinataire
- Met `notif_envoyee = true`

## Pages et composants

### Page `/lettres` (Server Component)
- Auth requise, redirige vers `/login` sinon
- Papa → charge toutes ses lettres → affiche `LettreListePapa`
- Fille → charge ses lettres → affiche `LettreListeFille`

### `LettreListePapa`
- Bouton "Écrire une lettre" → ouvre `LettreEditor` (modal)
- Liste des lettres : destinataire, titre, date de déverrouillage, statut (🔒 verrouillée / ✅ déverrouillée), bouton modifier
- Bouton modifier → ouvre `LettreEditor` pré-rempli (sans champ date, non modifiable)

### `LettreEditor`
- Champs : Destinataire (Sandra / Sarah), Titre, Date de déverrouillage, Contenu (textarea)
- Raccourcis rapides : "18 ans de Sandra (14 nov 2031)" et "18 ans de Sarah (14 déc 2035)" pré-remplissent la date
- En mode modification : champ date désactivé (grisé), pas modifiable
- Validation : titre non vide, contenu non vide, unlock_at dans le futur (à la création)

### `LettreListeFille`
- Section "Lettres verrouillées" → cartes `LettreCardVerrouilee`
- Section "Lettres déverrouillées" → cartes `LettreCardDecouverte`
- Si aucune lettre : message poétique d'attente

### `LettreCardVerrouilee`
- Affiche : icône enveloppe cachetée, titre, "Une lettre t'attend", compte à rebours (X jours, X heures)
- Pas de bouton d'action

### `LettreCardDecouverte`
- Affiche : icône enveloppe ouverte, titre, date de déverrouillage, badge "Nouvelle !" si `lue_at` null
- Bouton "Lire" → ouvre `LettreDetail`

### `LettreDetail`
- Modal : affichage complet du contenu, date d'écriture, signature "Papa ♡"
- Appelle GET `/api/lettres/[id]` (marque lue_at automatiquement)

### NavBar
- Nouvelle icône lettres (parchemin/enveloppe cachetée, différente de l'email)
- Badge rouge si la fille a au moins une lettre déverrouillée non lue (`lue_at IS NULL AND unlock_at <= now()`)
- Papa : badge rouge si... rien (Papa n'a pas de lettres à lire)

## Vercel Cron

Dans `vercel.json` (ou `vercel.ts`) :
```json
{
  "crons": [
    { "path": "/api/lettres/cron", "schedule": "0 7 * * *" }
  ]
}
```
7h UTC = 8h Tunis (UTC+1) = 8h Lisbonne (UTC+1 en hiver, UTC+2 en été — approximation acceptable).

La route vérifie le header `Authorization: Bearer ${CRON_SECRET}`. La variable `CRON_SECRET` est déjà utilisée à l'étape 5 (notifications push) — réutiliser la même.

## Notification push

Texte : `"✉️ Une lettre de Papa vient de s'ouvrir !"` + titre de la lettre en corps.
Utilise le même mécanisme que l'étape 5 (Web Push API, subscriptions Supabase table `push_subscriptions`).

## Variables d'environnement

Aucune nouvelle variable — `CRON_SECRET` existe déjà depuis l'étape 5.

## Fonctionnalités par rôle

| Fonctionnalité | Papa | Sandra | Sarah |
|---|---|---|---|
| Écrire une lettre | ✅ | ❌ | ❌ |
| Modifier titre/contenu | ✅ | ❌ | ❌ |
| Supprimer | ✅ | ❌ | ❌ |
| Voir ses lettres verrouillées (compte à rebours) | ❌ | ✅ | ✅ |
| Lire une lettre déverrouillée | ❌ | ✅ | ✅ |
| Recevoir notif push | ❌ | ✅ | ✅ |

## Contraintes

- `unlock_at` gravé à la création, jamais modifiable côté serveur (PATCH rejette le champ)
- Le contenu ne transite jamais vers le navigateur d'une fille tant que `unlock_at > now()`
- Le cron utilise le compte service Supabase (clé `SUPABASE_SERVICE_ROLE_KEY`) pour bypasser RLS et accéder à toutes les lettres
- Compte à rebours calculé côté client en temps réel (JavaScript `setInterval`)
