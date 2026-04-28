# Étape 13 — Client Email Design

## Contexte

Client email intégré dans khedhiri.me pour les 3 membres de la famille (houssem, sandra, sarah @khedhiri.me). Hébergement email : OVH plan Perso (10 adresses, IMAP ssl0.ovh.net:993, SMTP ssl0.ovh.net:465). Accès discret dans la navbar (icône enveloppe), Papa utilise le client complet, les filles ont une version simplifiée.

## Architecture

```
[Browser] → [Next.js API routes] → [OVH IMAP/SMTP]
                     ↕
               [Supabase DB]
          (credentials chiffrés)
```

Les API routes font office de proxy : elles récupèrent les credentials chiffrés depuis Supabase, les déchiffrent côté serveur, ouvrent une connexion IMAP/SMTP, et retournent les données au client. Les credentials ne transitent jamais en clair côté browser.

## Base de données

### Table `email_credentials`
```sql
CREATE TABLE email_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_password TEXT NOT NULL,  -- AES-GCM, clé dérivée côté serveur
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS : chaque user ne voit que sa propre ligne
```

Le login IMAP = adresse @khedhiri.me de l'utilisateur (déjà connue via `profiles.email`). Seul le mot de passe email OVH est stocké.

Chiffrement : AES-GCM 256-bit, clé = `HMAC-SHA256(EMAIL_ENCRYPTION_SECRET, user_id)` où `EMAIL_ENCRYPTION_SECRET` est une variable d'environnement Vercel.

## API Routes

Toutes les routes vérifient l'authentification Supabase avant d'agir.

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/email/setup` | POST | Chiffre et sauvegarde le mot de passe email |
| `/api/email/messages` | GET | Liste les messages (paramètre : `folder`, `page`) |
| `/api/email/message/[uid]` | GET | Corps complet d'un message |
| `/api/email/send` | POST | Envoie un email via SMTP |
| `/api/email/message/[uid]` | DELETE | Supprime un message (Papa uniquement) |

Librairies : `imapflow` (IMAP), `nodemailer` (SMTP).

## Pages et Composants

### Page `/email`
- Lien discret dans NavBar (icône ✉️, après Tuteur)
- Si credentials non configurés → affiche `EmailSetup`
- Sinon → affiche `EmailInbox`

### `EmailSetup`
- Formulaire de saisie du mot de passe email OVH
- Explications simples (texte adapté selon Papa/Sandra/Sarah)
- Bouton "Configurer ma boîte mail"
- Appelle `POST /api/email/setup`

### `EmailInbox`
- Liste des messages : expéditeur, sujet, date, aperçu
- Pagination simple (20 messages par page)
- Papa : sélecteur de dossier (INBOX, Sent, Trash)
- Filles : INBOX uniquement
- Clic → ouvre `EmailMessage`
- Bouton "Nouveau message" → ouvre `EmailCompose`

### `EmailMessage`
- Affichage complet du message (HTML sanitisé ou texte)
- Bouton "Répondre"
- Bouton "Supprimer" (Papa uniquement)
- Pièces jointes : affichage images inline, download pour autres

### `EmailCompose`
- Champs : À, Sujet, Corps
- Papa : Cc, champ libre complet
- Filles : interface simplifiée, pas de Cc
- Bouton "Envoyer"

## Fonctionnalités par rôle

| Fonctionnalité | Papa | Sandra | Sarah |
|---|---|---|---|
| Configurer boîte | ✅ | ✅ | ✅ |
| Lire (INBOX) | ✅ | ✅ | ✅ |
| Lire (autres dossiers) | ✅ | ❌ | ❌ |
| Écrire / Répondre | ✅ | ✅ | ✅ |
| Supprimer | ✅ | ❌ | ❌ |
| Pièces jointes | ✅ (tout) | ✅ (images) | ✅ (images) |

## Variables d'environnement

```
EMAIL_ENCRYPTION_SECRET=<secret 32+ chars>
OVH_IMAP_HOST=ssl0.ovh.net
OVH_IMAP_PORT=993
OVH_SMTP_HOST=ssl0.ovh.net
OVH_SMTP_PORT=465
```

## Contraintes

- Vercel serverless : connexion IMAP recréée à chaque requête (pas de connexion persistante)
- Timeout Vercel : 10s par défaut (suffisant pour IMAP simple, attention aux boîtes volumineuses)
- HTML emails : sanitiser avec `dompurify` côté serveur avant envoi au client
- Pas de push notifications email pour l'instant (polling manuel)
