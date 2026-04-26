# 🌅 khedhiri.me — Guide complet du projet (v2)

> **Notre espace familial entre Lisbonne et Tunis**
> Pour Sandra (12 ans), Sarah (8 ans) et Papa Houssem
> Vision finalisée en avril 2026

---

## 📖 Lire aussi

- 📜 **`khedhiri-manifesto.md`** — L'âme du projet (à relire régulièrement)
- 🚀 **`khedhiri-etape-1.md`** — Guide pratique pour démarrer
- 🧠 **`CLAUDE.md`** — Mémoire technique pour Claude Code
- 🎨 **`khedhiri-prototype.html`** — Maquette visuelle générale
- 💬 **`khedhiri-mur-chat-mockup.html`** — Maquette timeline & chat
- 🤖 **`khedhiri-llm-local-preparation.md`** — Guide LLM local (pour étape 11)

---

## 🎯 Vision en 3 phrases

khedhiri.me est une application web **privée, familiale, temps-réel** qui relie Sandra, Sarah et leur père Houssem malgré la distance Tunis ↔ Lisbonne. Elle combine communication quotidienne, transmission de mémoire familiale, découverte biculturelle, expression personnelle sécurisée, et assistance scolaire intelligente via un LLM local. Chaque fonctionnalité sert un unique objectif : **que les filles se sentent aimées, vues, écoutées et en sécurité, même loin de leur père**.

---

## 👨‍👧‍👧 La famille

| Membre | Email | Localisation | Anniversaire |
|--------|-------|--------------|--------------|
| Houssem (Papa) | houssem@khedhiri.me | Lisbonne 🇵🇹 | — |
| Sandra | sandra@khedhiri.me | Tunisie 🇹🇳 | 14 novembre 2013 |
| Sarah | sarah@khedhiri.me | Tunisie 🇹🇳 | 14 décembre 2017 |

**Authentification** : email + mot de passe classique (les 3 comptes créés par Houssem).

---

## 🏗️ Architecture technique

### La stack fondatrice (gratuite)

| Couche | Outil | Pourquoi |
|--------|-------|----------|
| **Framework** | Next.js 15 (React) | Standard moderne, parfait avec Claude Code |
| **Langage** | TypeScript | Sécurité + aide de l'éditeur |
| **Style** | Tailwind CSS | Rapide, design propre, cohérent |
| **Base + Auth + Storage + Realtime** | Supabase | Tout-en-un, généreux plan gratuit |
| **Hébergement** | Vercel | Déploiement auto, gratuit, sécurisé |
| **Versionnage** | GitHub (repo privé) | Sauvegarde + déclencheur Vercel |
| **Domaine** | khedhiri.me (OVH) | Déjà acheté ✅ |
| **PWA** | next-pwa | App installable sur mobile |
| **Push notifications** | Web Push API | Notifs sur téléphone des filles |

### La stack avancée (étape 11+)

| Couche | Outil | Rôle |
|--------|-------|------|
| **LLM** | Ollama + Llama 4 / Gemma 4 / Mistral | Tuteur IA local |
| **Serveur** | Machine chez Houssem à Lisbonne | Fait tourner le LLM |
| **Tunnel** | Cloudflare Tunnel (gratuit) | Expose le LLM sur internet de façon sécurisée |
| **Email client** | Nodemailer + IMAP library | Lecture/écriture des emails @khedhiri.me |

### Flux de données

```
Houssem (Lisbonne) ──┐
Sandra (Tunis)    ───┼──► khedhiri.me (Vercel)  ──► Supabase
Sarah (Tunis)     ───┘         │
                                │
                                └──► LLM local (Lisbonne) via Cloudflare Tunnel
```

### Coûts

| Poste | Coût | Fréquence |
|-------|------|-----------|
| Vercel Hobby | 0 € | mensuel |
| Supabase Free | 0 € | mensuel |
| GitHub | 0 € | mensuel |
| OVH (domaine) | ~8 € | annuel (déjà payé) |
| Matériel LLM local | ~800-4000 € | **unique** (à voir, Houssem possède déjà du matériel) |
| Électricité LLM | ~10-80 €/an | annuel |
| **Total récurrent** | **~0 €/mois** | |

---

## 🗺️ Feuille de route — 20 étapes

### 🏗️ Phase 1 — Fondations (étapes 1-5) · ~15h

Après ces étapes, **l'app est déjà vivante et utilisable au quotidien**.

#### ✅ Étape 1 — Fondations techniques
Installer le projet, déployer sur Vercel, connecter khedhiri.me.
> 📖 Guide dédié : `khedhiri-etape-1.md`

#### Étape 2 — Authentification + 3 comptes
Login/logout, création des 3 comptes, profils personnalisés selon qui est connecté.

#### Étape 3 — Timeline familiale temps-réel + vocaux ⭐
Le cœur du projet. Une seule timeline = chat de groupe. Textes, photos, vocaux. Réactions en temps réel. C'est LA fonctionnalité principale.

#### Étape 4 — Chats individuels temps-réel
3 conversations 1-à-1 : Papa↔Sandra, Papa↔Sarah, Sandra↔Sarah. Chacune son jardin.

#### Étape 5 — PWA installable + Notifications push
L'app devient installable comme une vraie app sur les téléphones et tablettes. Les filles reçoivent des notifications.

---

### 🎨 Phase 2 — Richesse (étapes 6-10) · ~13h

Ces étapes rendent l'app **vraiment spéciale et personnelle**.

#### Étape 6 — Album photos + Coin créatif de Sarah
Galerie chronologique. Le coin créatif de Sarah met ses dessins en valeur comme une vraie galerie d'art.

#### Étape 7 — Agenda + Compte à rebours + Carte interactive
Anniversaires, appels du dimanche, prochaines retrouvailles. Carte qui montre où sera Papa.

#### Étape 8 — Espaces perso personnalisables
Chacun choisit ses couleurs, son avatar, son ambiance. "Ma page, c'est moi."

#### Étape 9 — Découverte Lisbonne / Tunis
Papa montre Lisbonne aux filles (photos légendées, mini-visites). Les filles montrent Tunis à Papa.

#### Étape 10 — Journaux intimes (Sandra ET Sarah) 🔒
Avec **double mot de passe** et **chiffrement côté client**. Même Papa ne peut pas lire. Sanctuaire dans le sanctuaire.

---

### 🧠 Phase 3 — Transmission & Intelligence (étapes 11-14) · ~24h

La partie qui rend khedhiri.me **unique au monde**.

#### Étape 11 — Tuteur IA local 🤖
LLM hébergé chez Houssem à Lisbonne. Un seul tuteur qui s'adapte à chaque fille. Comprend les photos de leçons. Mode vocal pour Sarah. Adapté au programme scolaire tunisien. Papa voit l'historique.
> 📖 Guide dédié : `khedhiri-llm-local-preparation.md`

#### Étape 12 — Boîte à mémoire + Arbre généalogique
Histoires de famille, souvenirs, recettes transmises. Arbre généalogique interactif (racines tunisiennes vivantes).

#### Étape 13 — Client email simple
Les filles accèdent à leurs emails @khedhiri.me directement dans l'app (lecture + réponse basique).

#### Étape 14 — Lettres pour leurs 18 ans 💌
Papa écrit aujourd'hui, daté pour déblocage à 18 ans. Sandra les lira le 14 nov 2031. Sarah le 14 déc 2035. **Trésor ultime.**

---

### ✨ Phase 4 — Enrichissement (étapes 15-20) · ~18h

La cerise sur le gâteau. Viennent progressivement au fil des mois.

#### Étape 15 — Bouton câlin virtuel + Messages vocaux préenregistrés
Sarah peut demander un "câlin de Papa" à tout moment. Papa peut préenregistrer des messages pour les moments où il n'est pas joignable.

#### Étape 16 — Défis hebdomadaires + Mots bilingues FR/AR
Chaque semaine un défi partagé. Mots du jour en français et arabe.

#### Étape 17 — Lectures partagées + Défis éducatifs
Papa enregistre des histoires du soir. Défis maths/sciences entre filles.

#### Étape 18 — Quiz et jeux personnalisés
"Connais-tu ta sœur ?", défis familiaux, mini-jeux.

#### Étape 19 — Atelier créatif (dessin)
Outil de dessin dans le navigateur. Galerie partagée des œuvres.

#### Étape 20 — Personnalisation finale
Thèmes qui changent selon les saisons, messages automatiques Ramadan/Noël/anniversaires, rituels.

---

## ⏱️ Estimation globale

- **Phase 1 (essentiel)** : ~15h → peut être fait en 2-3 week-ends
- **Phase 2 (richesse)** : ~13h → 2-3 week-ends
- **Phase 3 (transmission)** : ~24h (dont 15h matériel/setup LLM) → 1-2 mois
- **Phase 4 (enrichissement)** : ~18h → répartie sur le temps
- **Total** : ~70h sur **4 à 6 mois** à rythme confortable

---

## 💡 Principes à garder en tête

### Pour rester heureux pendant la construction

1. **Une étape à la fois.** Ne pas regarder le total. Juste la prochaine.
2. **Tester et livrer.** À la fin de chaque étape, que ça marche et que ça soit en ligne.
3. **Parler aux filles.** Montre-leur des petites choses au fil du temps. Leurs réactions te nourrissent.
4. **Pas de perfection.** Ce qui est imparfait mais en ligne bat ce qui est parfait dans ta tête.
5. **Célébrer les milestones.** Étape 5 atteinte = champagne. Étape 10 = plat préféré. Étape 20 = voyage en Tunisie.

### Pour ne pas abandonner

Si tu perds la motivation, **relis le Manifesto**. Si ça ne suffit pas, **montre l'app aux filles** — leur joie te rallumera.

Si tu bloques techniquement, **écris-moi**. On débloque ensemble.

Si la vie prend le dessus pendant 3 mois, **c'est OK**. L'app n'est pas périssable. Tes filles seront toujours là.

---

## 🔐 Principes de sécurité et confidentialité

- L'app est **privée**, inscription impossible
- Les **journaux intimes** sont chiffrés côté client (même Papa ne lit pas)
- Le **tuteur IA** tourne localement chez Papa (aucune donnée des filles dans le cloud)
- Les **emails** restent sur les serveurs OVH (déjà en place)
- **Aucune publicité, aucun tracking tiers**
- Backups : Supabase fait des backups automatiques (free tier)

---

## 🎯 Prochaine action

➡️ **Ouvre `khedhiri-etape-1.md` et suis-le pas à pas.**

À la fin de la soirée où tu le fais, khedhiri.me sera en ligne avec ta première page d'accueil. Les 19 étapes suivantes sont ton chemin vers le projet complet, à ton rythme.

---

## 🌟 Pour conclure

Tu as devant toi un plan solide pour construire **quelque chose de rare** :
- Un espace numérique privé entre un père et ses deux filles
- Avec l'équivalent d'un WhatsApp amélioré
- Plus un album de famille vivant
- Plus un tuteur scolaire personnalisé qui tourne chez toi
- Plus une capsule temporelle pour leurs 18 ans
- Plus des jardins secrets pour chaque fille
- Le tout en respectant leurs racines tunisiennes et ta vie portugaise

Ce projet est **ambitieux**, oui. Mais chaque étape prise individuellement est **réalisable**. Tu n'as pas besoin de tout finir pour que ça ait de la valeur. Dès l'étape 5, Sandra et Sarah auront un outil qu'elles utiliseront tous les jours.

Et quand elles auront 20 et 24 ans, elles se connecteront toujours à khedhiri.me, elles reliront les vieilles conversations, elles ouvriront les lettres que tu auras écrites, et elles pleureront de gratitude.

**Ça, Houssem, c'est l'œuvre d'une vie.**

---

*Fait avec ♡ entre Lisbonne et Tunis.*
*Pour Sandra et Sarah.*
