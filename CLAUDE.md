# CLAUDE.md — Mémoire du projet khedhiri.me

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> **Il doit être consulté avant toute modification du projet.**
> À mettre à jour à la fin de chaque étape.

---

## 📜 À lire AVANT tout

Avant de coder quoi que ce soit, lis le fichier `khedhiri-manifesto.md` à la racine.
C'est **l'âme** du projet. Chaque décision technique doit la servir.

khedhiri.me n'est pas une app ordinaire : c'est une **lettre d'amour codée** d'un père (Houssem, à Lisbonne) à ses deux filles (Sandra 12 ans et Sarah 8 ans, en Tunisie). L'émotion prime sur la performance. La chaleur prime sur la fonctionnalité. La simplicité pour Sarah (8 ans) prime sur la richesse des fonctionnalités.

---

## 🎯 Vision résumée

Application web familiale privée, temps-réel, installable comme PWA, accessible uniquement à 3 personnes :

| Membre | Email | Rôle | Âge | Anniversaire |
|--------|-------|------|-----|--------------|
| Houssem (Papa) | houssem@khedhiri.me | admin | — | — |
| Sandra | sandra@khedhiri.me | enfant | 12 ans | 14 nov 2013 |
| Sarah | sarah@khedhiri.me | enfant | 8 ans | 14 déc 2017 |

**Authentification** : email + mot de passe classique.
**Langue** : français uniquement (avec fonctionnalité bilingue FR/AR plus tard).

---

## 🏗️ Stack technique

### Stack principale (étapes 1-10)
- **Framework** : Next.js 15 (App Router) + TypeScript
- **Style** : Tailwind CSS
- **Base + Auth + Storage + Realtime** : Supabase
- **Hébergement** : Vercel (déploiement auto via GitHub)
- **Versionnage** : GitHub (repo privé)
- **Domaine** : khedhiri.me (DNS chez OVH)
- **PWA** : next-pwa ou équivalent
- **Notifications push** : Web Push API + Supabase ou OneSignal
- **Chiffrement journal intime** : chiffrement côté client (Web Crypto API)

### Stack avancée (à partir de l'étape 11 — tuteur IA)
- **LLM local** : Ollama + modèle à choisir (Llama 4 Scout / Gemma 4 31B / Mistral Large 3)
- **Serveur LLM** : machine chez Houssem à Lisbonne
- **Tunnel sécurisé** : Cloudflare Tunnel (gratuit, gère IP dynamique)
- **Client email** (étape 12) : bibliothèque IMAP/SMTP Node.js

**Coût mensuel total** : ~0 €/mois (domaine ~8€/an). Matériel LLM local : investissement unique.

---

## 🎨 Direction artistique

### Palette (univers méditerranéen Lisbonne ↔ Tunis)
```
--terracotta: #C5563D    (principale, accents)
--terracotta-deep: #9B3F2A
--olive: #6B7B3F         (secondaire)
--azur: #2E5C8A          (mer, Lisbonne)
--azur-deep: #1E3F62
--sand: #F4E8D8          (fond clair)
--sand-warm: #EDD9BC
--cream: #FAF4EA         (fond principal)
--jasmine: #FFF8E7       (cartes)
--gold: #D4A04C          (accents précieux)
--rose: #E8A598          (touches douces)
--ink: #2A1F18           (texte)
--ink-soft: #5A4A3F
```

### Typographies (NE PAS utiliser Inter, Roboto, Arial)
- **Display / titres** : Fraunces (serif élégante, italiques pour l'émotion)
- **Texte** : Manrope (sans-serif moderne)
- **Manuscrit / poétique** : Caveat (cursive chaleureuse)

### Principes design
- Cartes flottantes avec légère rotation (effet polaroïd)
- Animations douces : float, fade-up, micro-interactions
- Texture grain subtile en overlay (SVG noise filter)
- Asymétrie assumée
- Gros boutons et icônes claires (pour Sarah 8 ans)
- Accessibilité : contraste AAA, labels explicites, navigation clavier

> **Référence visuelle** : `khedhiri-prototype.html` et `khedhiri-mur-chat-mockup.html` à la racine.

---

## 🗺️ Roadmap — 20 étapes

### Fondations critiques (étapes 1-5)
- [x] **Étape 1** — Fondations (Next.js, Vercel, domaine)
- [x] **Étape 2** — Authentification + 3 comptes
- [x] **Étape 3** — Timeline familiale temps réel + vocaux (cœur du projet)
- [x] **Étape 4** — Chats individuels temps réel (Papa↔Sandra, Papa↔Sarah, Sandra↔Sarah)
- [x] **Étape 5** — PWA installable + Notifications push mobile

### Fonctionnalités riches (étapes 6-10)
- [x] **Étape 6** — Album photos + Coin créatif de Sarah
- [x] **Étape 7** — Agenda + compte à rebours + Carte interactive
- [x] **Étape 8** — Espaces perso personnalisables (avatars, couleurs)
- [x] **Étape 9** — Découverte Lisbonne / Tunis
- [x] **Étape 10** — **Journaux intimes (Sandra ET Sarah) avec double mot de passe et chiffrement côté client** 🔒

### Transmission & intelligence (étapes 11-14)
- [x] **Étape 11** — **🤖 Tuteur IA local Nour** (Ollama + Cloudflare Tunnel, adapté à chaque fille)
- [x] **Étape 12** — **🌳 Arbre généalogique** (page /famille, MembreCard/MembreDetail, AjouterMembre, anecdotes)
- [x] **Étape 13** — **✉️ Client email IMAP/SMTP** (OVH Perso, proxy API serveur, chiffrement AES-256-GCM, Papa complet + filles simplifié)
- [x] **Étape 14** — **📜 Lettres pour leurs 18 ans** (verrou temporel côté serveur, compte à rebours, notif push, cron Vercel)

### Enrichissement (étapes 15-20)
- [x] **Étape 15** — Bouton câlin virtuel + messages vocaux préenregistrés
- [x] **Étape 16** — Défis hebdomadaires + mots bilingues FR/AR
- [x] **Étape 17** — Lectures partagées + défis éducatifs
- [x] **Étape 18** — Quiz et jeux personnalisés
- [x] **Étape 19** — Atelier créatif enrichi (coloriages SVG, tampons, Coin souvenir, réactions, publier)
- [ ] **Étape 20** — Personnalisation finale (thèmes saisons, rituels)
- [ ] **Étape 21** — Étapes manuelles consolidées (Supabase SQL + buckets Storage en attente)

> 🔥 **Après l'étape 5, l'app est déjà vivante et utilisable au quotidien.**

---

## 🔒 Spécifications critiques — Journal intime (étape 10)

Sandra ET Sarah ont chacune leur journal intime, avec ces règles **inviolables** :

1. **Double authentification** : connexion normale + second mot de passe spécifique au journal
2. **Chiffrement côté client** (Web Crypto API) : contenu chiffré dans le navigateur avant envoi à Supabase
3. **Même l'admin (Papa) ne peut pas lire** le contenu — c'est le prix de la vraie confidentialité
4. **Stockage chiffré** dans Supabase (même si la DB fuite, le contenu reste illisible)
5. **Indice personnel** enregistré pour aider à se souvenir du mot de passe
6. **Avertissement clair** : si le mdp est oublié, le contenu est perdu

Pour Sarah (8 ans) : mot de passe **extrêmement simple** (ex: `LicorneRose`).
Pour Sandra (12 ans) : plus robuste possible.

---

## 🤖 Spécifications critiques — Tuteur IA local (étape 11)

### Architecture
```
[Serveur local à Lisbonne] → [Cloudflare Tunnel] → [khedhiri.me sur Vercel] → [Sandra & Sarah à Tunis]
```

### Exigences fonctionnelles
- **Un seul tuteur** mais qui s'adapte selon qui parle (Sandra vs Sarah)
- **Disponible de deux manières** : page dédiée "Mon tuteur" + bouton flottant partout
- **Entrée photo** : les filles peuvent photographier leur cahier/leçon
- **Mode vocal** : conversation à la voix (important pour Sarah)
- **Programme scolaire français** (école française en Tunisie) : primaire (Sarah, cycle 2-3) + collège (Sandra, cycle 3-4, programme Éducation Nationale française)
- **Cours d'arabe spécifique** : les deux filles ont des cours d'arabe en plus, le tuteur doit pouvoir les aider sur la langue arabe (grammaire, vocabulaire, écriture, conjugaison)
- **Historique accessible à Papa** : voir toutes les conversations, féliciter, ajuster
- **Suivi de progression** : ce que chacune a travaillé, points forts/faibles

### Ton pédagogique
- L'IA **fait réfléchir** plutôt que de donner la réponse
- Encourage, pas juge
- Utilise analogies de l'âge (bonbons, dattes, jouets pour Sarah)
- Peut avoir un nom/personnalité (ex: "Zoubida" ou "Nour")

### Garde-fous enfants
- Refuse les sujets hors-scolaire (gentiment)
- Ne traite pas de contenus sensibles (violence, sexualité, etc.)
- Limite de temps/requêtes par jour configurable par Papa

### Matériel (confirmé avec Houssem)
- **PC tour à Lisbonne** avec :
  - GPU : **RTX 4070 Ti SUPER (16 Go VRAM)** — excellent pour LLM local
  - RAM : 32 Go
  - CPU : Intel i5 / Ryzen 5
  - Connexion : fibre (excellente)
- **Modèle LLM recommandé** : **Gemma 4 12B** (tient sur 16 Go VRAM, excellent en français, multimodal, support arabe)
- **Modèle de secours** : Gemma 4 E4B (3 Go, ultra rapide)
- **Alternative** : Mistral Small 3 (13 Go, français natif)
- **Disponibilité** : à trancher — PC éteint le soir, options possibles (24/7, Wake-on-LAN, serveur dédié, hybride)

### Plan B
- Si le LLM local ne donne pas satisfaction, on bascule vers API (Claude, Mistral)
- L'architecture code permet le switch en ~30 min

---

## 👥 Rôles utilisateurs

- **Papa** : admin, voit tout le contenu public, crée des lettres datées, peut voir l'historique du tuteur, configure les paramètres
- **Sandra** : poste, chatte, journal intime privé, personnalise son espace, accès tuteur
- **Sarah** : mêmes droits que Sandra, interface visuelle adaptée (plus gros boutons, plus d'emojis, vocal privilégié)

Tous voient la timeline familiale. Chats individuels visibles uniquement par les 2 participants.

---

## 🧠 Conventions de code

- **Langue** : commentaires, noms de variables, textes UI en **français**
- **Composants** : un par fichier, PascalCase
- **Routing** : Next.js App Router
- **Style** : Tailwind uniquement
- **Responsive** : mobile-first (les filles utilisent surtout téléphone/tablette)
- **Accessibilité** : labels sur inputs, contraste AAA, navigation clavier
- **Secrets** : jamais dans Git, toujours dans `.env.local`
- **Architecture tuteur IA** : abstraction du provider (local Ollama / API Claude / API Mistral interchangeables)

---

## 💡 Préférences de Houssem

- Niveau technique : débutant éclairé, compte sur Claude Code
- OS dev : Windows
- Avance **étape par étape**, teste chaque morceau avant de passer au suivant
- Préfère les explications simples et les analogies
- Très investi affectivement → traiter le projet avec soin, chaleur, poésie
- **Valeurs fortes** : souveraineté des données, indépendance technique, privilégie le local au cloud quand c'est raisonnable

---

## ⚠️ À NE JAMAIS FAIRE

- ❌ Rendre l'app publique ou ouvrir les inscriptions
- ❌ Intégrer de la publicité ou du tracking tiers
- ❌ Modifier les MX records DNS d'OVH (emails @khedhiri.me dépendent d'eux)
- ❌ Stocker des secrets dans Git
- ❌ Utiliser Inter, Roboto, Arial (typos génériques)
- ❌ Utiliser des couleurs hors palette définie
- ❌ Exposer le contenu des journaux intimes même à l'admin
- ❌ Ajouter des fonctionnalités qui ne servent pas l'émotion / le lien familial
- ❌ Prétendre que l'app remplace les vraies retrouvailles
- ❌ Ignorer la dimension biculturelle tunisienne / portugaise
- ❌ Envoyer les données des filles à un API cloud sans l'approbation explicite de Houssem

---

## 📂 Structure du projet

```
C:\KHEDHIRI\                                ← Dossier racine sur le PC de Houssem
├── CLAUDE.md                               ← Ce fichier
├── docs\                                   ← Documents de vision/référence
│   ├── khedhiri-manifesto.md               ← L'âme du projet
│   ├── khedhiri-guide-projet.md            ← Vue d'ensemble
│   ├── khedhiri-etape-1.md                 ← Guide de démarrage
│   ├── khedhiri-llm-local-preparation.md   ← Guide LLM local (étape 11)
│   ├── khedhiri-prototype.html             ← Référence design visuelle
│   └── khedhiri-mur-chat-mockup.html       ← Référence mur & chat
├── public/
├── src/
│   ├── app/
│   │   ├── page.tsx                        ← Timeline familiale (accueil post-login)
│   │   ├── login/
│   │   ├── chats/[userId]/                 ← Chats individuels
│   │   ├── album/
│   │   ├── agenda/
│   │   ├── decouverte/                     ← Lisbonne / Tunis
│   │   ├── journal/                        ← Journaux intimes (privés)
│   │   ├── tuteur/                         ← Page tuteur IA (étape 11)
│   │   ├── memoire/                        ← Boîte à mémoire + arbre
│   │   ├── email/                          ← Client email (étape 13)
│   │   ├── lettres/                        ← Lettres pour 18 ans
│   │   ├── calin/                          ← Bouton câlin virtuel
│   │   ├── defis/                          ← Défis hebdomadaires
│   │   ├── lectures/                       ← Lectures partagées
│   │   ├── jeux/                           ← Quiz et jeux
│   │   └── atelier/                        ← Atelier créatif
│   ├── components/
│   │   ├── ui/                             ← Composants UI réutilisables
│   │   └── tutor-widget/                   ← Bouton flottant tuteur (étape 11)
│   └── lib/
│       ├── supabase/
│       └── tutor/                          ← Abstraction LLM (local/API)
└── package.json
```

---

## 📝 Journal des sessions

| Date | Session | Résultat |
|------|---------|----------|
| Avril 2026 | Conception initiale | Vision, roadmap 20 étapes, Manifesto, prototype |
| Avril 2026 | Étape 1 | Next.js 15 initialisé, système de design configuré (palette + Fraunces/Manrope/Caveat), page d'accueil, déployé sur khedhiri.me |
| Avril 2026 | Étape 2 | Supabase SSR, middleware de protection des routes, page de connexion stylisée, page d'accueil personnalisée, 3 comptes créés (houssem/sandra/sarah@khedhiri.me), variables d'env Vercel configurées, déployé sur khedhiri.me |
| Avril 2026 | Étape 3 | Timeline familiale temps réel : schéma Supabase (posts/réactions/profils/storage), server actions, composants VoicePlayer/ReactionBar/PostCard/VoiceRecorder/ComposeBar/Timeline, Realtime subscriptions, SSR initial posts, déployé sur khedhiri.me |
| Avril 2026 | Étape 4 | Chats individuels bilatéraux temps réel (texte/photo/audio), NavBar, VoiceRecorder découplé via onRecorded, RLS par conversation_id, déployé sur khedhiri.me |
| Avril 2026 | Étape 5 | PWA installable : manifest.ts (standalone, terracotta), service worker push (sw.js), PushRegistrar côté client, icônes dynamiques via next/og (/icons/[size]), VAPID push notifications |
| Avril 2026 | Étape 6 | Album photos (PhotoGrid, upload Supabase Storage) + Atelier créatif Sarah (DrawingCanvas HTML5, sauvegarde créations, CreationCard), schéma SQL creations |
| Avril 2026 | Étape 7 | Agenda familial : CalendrierMensuel, CompteAReboursSection (anniversaires, rencontres), CarteInteractive Lisbonne/Tunis, schéma SQL evenements |
| Avril 2026 | Étape 8 | Personnalisation profils : avatar upload, couleur de thème, bio, page /profil et /profil/[userId], schéma SQL mis à jour (avatar_url, couleur) |
| Avril 2026 | Étape 9 | Page Découverte Lisbonne/Tunis : MotCard, HighlightCard, DistanceBanner, contenu biculturel |
| Avril 2026 | Étape 10 | Journaux intimes chiffrés côté client : AES-GCM + PBKDF2 (Web Crypto API), journal_profils + journal_entrees Supabase, papa bloqué explicitement, composants CreerJournal/DeverrouillerJournal/EntreeEditor/JournalOuvert |
| Avril 2026 | Étape 11 | Tuteur IA "Nour" : Ollama local (Lisbonne) + Cloudflare Tunnel, API routes /api/tutor, abstraction provider (local/Claude/Mistral), TuteurChat enfants + TuteurPapa dashboard, TuteurWidget flottant, sessions/messages Supabase, garde-fous enfants |
| Avril 2026 | Étape 12 | Arbre généalogique : table famille_membres + famille_anecdotes, composants MembreCard/MembreDetail/AjouterMembre/AjouterAnecdote, page /famille, actions Server-side |
| Avril 2026 | Étape 13 | Client email IMAP/SMTP OVH Perso : table email_credentials (AES-256-GCM, clé HMAC-SHA256 par user), API proxy routes (setup/messages/message/[uid]/send), composants EmailSetup/EmailInbox/EmailMessage/EmailCompose, page /email, icône navbar |
| Avril 2026 | Étape 14 | Lettres pour leurs 18 ans : table lettres (RLS, verrou temporel serveur), API routes (GET+POST /api/lettres, GET+PATCH+DELETE /api/lettres/[id]), cron Vercel 7h UTC, composants LettreEditor/LettreCard/LettreDetail/LettreListePapa/LettreListeFille, page /lettres, badge navbar |
| Avril 2026 | Étape 15 | Câlins virtuels + vocaux préenregistrés : tables vocaux + calins (Supabase Storage bucket `calins`, Realtime), API routes vocaux (GET/POST/DELETE) + calins (GET/POST) + ecouter (POST), composants VocalRecorder/BibliothequeVocaux/EnvoyerCalin/CalinsRecus/CalinRealtimeListener/CalinPage, page /calin, badge cœur NavBar |
| Avril 2026 | Étape 16 | Défis hebdomadaires + mots bilingues FR/AR : tables defis + reponses_defis (UNIQUE constraint, service role pour `correct`), API GET+POST /api/defis + GET+POST /api/defis/[id]/reponses (upload photo, normalisation arabe, vérification quiz), composants DefiCard/MotCard/CreerDefi/DefisPage, page /defis, intégration Timeline (5 derniers défis, Realtime INSERT, lien "Voir tous les défis") |
| Avril 2026 | Étape 17 | Lectures partagées : tables lectures + avancement_lecture + questions_lecture + reponses_questions, API routes GET+POST /api/lectures + /api/lectures/[id]/avancement + /api/lectures/[id]/questions + /api/lectures/[id]/reponses, composants LectureCard/LecturePage/LectureDetail/QuestionForm, page /lectures |
| Avril 2026 | Étape 18 | Quiz et jeux personnalisés : tables quizzes + questions_quiz + sessions_quiz + reponses_session, API routes CRUD quizzes + sessions, composants QuizCard/JouerQuiz/CreerQuiz/QuizSection, page /jeux, intégration DefisPage avec section quiz |
| Avril 2026 | Étape 19 | Atelier créatif enrichi : 6 coloriages SVG (public/coloriages/), tampons emoji (placés sur canvas), table reactions_creations (UNIQUE par creation+membre+emoji, RLS, Realtime), API GET+POST /api/creations + /api/creations/[id]/reactions (toggle) + /api/creations/[id]/publier, composants DrawingCanvas enrichi + CoinSouvenir (galerie partagée, upload photo, réactions, publier sur mur) + AtelierPageClient (2 onglets), PR #5 |

---

## 📚 Liens utiles

- **Repo GitHub** : `https://github.com/Houssemeddine2/khedhiri` (privé)
- **Dashboard Vercel** : https://vercel.com/dashboard
- **Dashboard Supabase** : https://supabase.com/dashboard
- **Site** : https://khedhiri.me
- **Docs Next.js** : https://nextjs.org/docs
- **Docs Supabase** : https://supabase.com/docs
- **Ollama** : https://ollama.com (pour étape 11)
- **Cloudflare Tunnel** : https://www.cloudflare.com/products/tunnel/ (pour étape 11)

---

*Avec tout l'amour possible, pour Sandra et Sarah. ♡*
