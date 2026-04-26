# 🚀 khedhiri.me — Étape 1 : Mettre le site en ligne

> **Objectif de cette étape** : Avoir une vraie page web à l'adresse https://khedhiri.me ce soir
> **Temps estimé** : 1h30 à 2h
> **Niveau** : Débutant guidé — copie-colle et ça marche

---

## 📋 Avant de commencer

Garde ce guide ouvert dans une fenêtre, et fais les étapes dans l'ordre. **Ne saute aucune étape**, même si elle semble évidente.

À la fin tu auras :
- ✅ Le projet Next.js créé sur ton ordi
- ✅ Le code sauvegardé sur GitHub
- ✅ Le site déployé sur Vercel
- ✅ Le domaine khedhiri.me qui pointe vers ton site

---

## 🧰 PARTIE 1 — Préparer ton ordinateur (15 min)

### 1.1 Vérifier que Node.js est installé

Ouvre **PowerShell** (clic droit sur le menu Démarrer → "Terminal" ou "Windows PowerShell").

Tape cette commande et appuie sur Entrée :

```powershell
node --version
```

**Résultat attendu** : quelque chose comme `v20.11.0` ou `v22.x.x`

❌ **Si tu vois une erreur** ("not recognized" ou similaire), Node.js n'est pas installé :
1. Va sur https://nodejs.org
2. Télécharge la version **LTS** (à gauche, en vert)
3. Installe-la avec les options par défaut (clique Suivant à tout)
4. **Ferme et rouvre PowerShell**, puis retape `node --version`

### 1.2 Vérifier Git

```powershell
git --version
```

**Résultat attendu** : `git version 2.x.x`

❌ Si erreur : télécharge https://git-scm.com et installe avec options par défaut.

### 1.3 Vérifier Claude Code

```powershell
claude --version
```

**Résultat attendu** : la version de Claude Code

❌ Si la commande n'est pas reconnue (alors que tu m'as dit qu'il était installé), c'est probablement un problème de PATH. Voici la solution :

```powershell
[Environment]::SetEnvironmentVariable("PATH", "$env:PATH;$env:USERPROFILE\.local\bin", [EnvironmentVariableTarget]::User)
$env:PATH = "$env:PATH;$env:USERPROFILE\.local\bin"
```

Puis ferme et rouvre PowerShell.

---

## 👤 PARTIE 2 — Créer tes comptes en ligne (15 min)

Ces 3 comptes sont **gratuits**. Crée-les avec ton email **houssem@khedhiri.me** pour tout centraliser.

### 2.1 GitHub
1. Va sur https://github.com/signup
2. Email : `houssem@khedhiri.me`
3. Choisis un mot de passe fort (note-le quelque part de sûr)
4. Username suggéré : `khedhiri` ou `houssem-khedhiri`
5. Vérifie ton email et confirme

### 2.2 Vercel
1. Va sur https://vercel.com/signup
2. Clique sur **"Continue with GitHub"** (le plus simple)
3. Autorise Vercel à accéder à ton GitHub
4. Choisis le plan **Hobby** (gratuit)

### 2.3 Supabase
1. Va sur https://supabase.com
2. Clique sur **"Start your project"**
3. **"Sign in with GitHub"** (pareil, le plus simple)

> ✅ Tu as maintenant les 3 comptes. On va créer le projet Supabase un peu plus tard, à l'Étape 2 du projet.

---

## 💻 PARTIE 3 — Créer le projet Next.js avec Claude Code (30 min)

### 3.1 Se placer dans le dossier du projet

Tu as déjà créé `C:\KHEDHIRI\` avec tes documents dans `C:\KHEDHIRI\docs\`. Parfait.

Ouvre **PowerShell** et exécute :

```powershell
cd C:\KHEDHIRI
```

> 📁 Ton projet Next.js sera créé **à l'intérieur** de ce dossier, à côté de `docs/` et de `CLAUDE.md`.

### 3.2 Démarrer Claude Code dans ce dossier

```powershell
claude
```

Claude Code va se lancer. La première fois il te demandera de te connecter (suis les instructions à l'écran).

### 3.3 Premier ordre : lui faire lire la doc

Une fois dans Claude Code, **commence toujours par ça** :

```
Lis attentivement CLAUDE.md à la racine puis tous les fichiers .md dans docs/.
Résume-moi ta compréhension du projet en 5 phrases avant qu'on commence à coder.
```

Claude Code va lire tes 5 fichiers de doc et te confirmer qu'il a compris la vision. Cela prend 30 secondes mais évite qu'il fasse des choses qui ne correspondent pas à l'esprit du projet.

### 3.4 Demander à Claude Code de créer le projet

Une fois qu'il a confirmé sa compréhension, **copie-colle ce message** :

```
Parfait. Maintenant créons le projet Next.js 15 directement dans ce dossier 
(C:\KHEDHIRI), sans créer de sous-dossier. Le dossier docs/ et CLAUDE.md 
doivent rester intacts.

Configuration souhaitée :
- TypeScript : oui
- Tailwind CSS : oui
- App Router : oui
- ESLint : oui
- src/ directory : oui
- Import alias : @/* (par défaut)
- Turbopack : oui

Utilise la commande npx create-next-app@latest avec les bons flags pour 
éviter les questions interactives. Le nom du projet dans package.json 
doit être "khedhiri".
```

Claude Code va exécuter `npx create-next-app@latest .` (avec le point pour dire "dans le dossier actuel") avec les bons paramètres. Laisse-le faire (il te demandera parfois des confirmations, dis "yes").


### 3.4 Tester en local

Toujours dans Claude Code, demande :

```
Lance le serveur de développement pour que je puisse voir le résultat dans mon navigateur.
```

Il va lancer `npm run dev`. Ouvre ton navigateur sur **http://localhost:3000** — tu devrais voir la page d'accueil par défaut de Next.js.

🎉 **Première victoire !** Le projet tourne sur ton ordinateur.

Pour arrêter le serveur : retourne dans la fenêtre PowerShell où il tourne et appuie sur `Ctrl + C`.

### 3.5 Personnaliser la page d'accueil

De retour dans Claude Code :

```
Remplace le contenu de la page d'accueil (src/app/page.tsx) par une page 
d'attente simple et chaleureuse en français qui dit :
- Titre : "khedhiri.me"
- Sous-titre : "Bientôt, notre petit monde entre Lisbonne et Tunis"
- Une mention "Pour Sandra, Sarah et Papa ♡"

Style : utilise Tailwind, fond crème (bg-amber-50), titre en grande typo serif, 
texte centré, couleur principale terracotta (text-orange-700).

Mets à jour aussi le titre HTML (metadata) à "khedhiri.me — Notre famille".
```

Relance `npm run dev` et vérifie sur http://localhost:3000.

---

## 📤 PARTIE 4 — Sauvegarder sur GitHub (15 min)

### 4.1 Créer un repository sur GitHub

1. Va sur https://github.com/new
2. **Repository name** : `Khedhiri`
3. **Description** : `Notre espace familial entre Lisbonne et Tunis`
4. **Privacy** : ⚠️ Coche **"Private"** (très important, c'est privé !)
5. **NE PAS** cocher "Add a README", "Add .gitignore", ou "Choose a license" (Next.js les a déjà créés)
6. Clique **"Create repository"**

GitHub va t'afficher une page avec des commandes. **Garde-la ouverte.**

### 4.2 Lier ton projet à GitHub via Claude Code

Retourne dans Claude Code et demande :

```
Je veux pousser ce projet sur GitHub. Mon repo s'appelle Khedhiri 
et mon username GitHub est [REMPLACE-ICI-PAR-TON-USERNAME].

Initialise git, fais un premier commit avec le message "Initial commit — 
fondations du projet familial", et pousse vers GitHub.
```

> ⚠️ Remplace `[REMPLACE-ICI-PAR-TON-USERNAME]` par ton vrai username GitHub avant d'envoyer le message à Claude Code.

Claude Code va exécuter quelque chose comme :
```bash
git init
git add .
git commit -m "Initial commit — fondations du projet familial"
git branch -M main
git remote add origin https://github.com/TON-USERNAME/Khedhiri.git
git push -u origin main
```

À un moment GitHub te demandera de t'authentifier. Suis les instructions (généralement une fenêtre s'ouvre dans ton navigateur).

### 4.3 Vérifier sur GitHub

Rafraîchis la page de ton repo sur github.com/TON-USERNAME/Khedhiri — tu dois voir tous les fichiers du projet. ✅

---

## 🌐 PARTIE 5 — Déployer sur Vercel (15 min)

### 5.1 Importer le projet

1. Va sur https://vercel.com/new
2. Tu devrais voir tes repos GitHub. Trouve **Khedhiri** et clique **"Import"**
3. **Project Name** : `khedhiri` (en minuscules pour l'URL Vercel)
4. **Framework Preset** : Next.js (détecté automatiquement)
5. Laisse tout le reste par défaut
6. Clique **"Deploy"**

Attends 1 à 2 minutes. ⏳

### 5.2 Premier triomphe

Quand le déploiement est terminé, tu vois un écran avec des confettis 🎉

Vercel te donne une URL temporaire du genre :
```
https://khedhiri-abcd1234.vercel.app
```

**Clique dessus** → tu dois voir ta page d'accueil chaleureuse. **Bravo, c'est en ligne !** 🚀

---

## 🔗 PARTIE 6 — Connecter khedhiri.me (le moment magique, 20 min)

C'est ici qu'on transforme l'URL Vercel moche en ton vrai domaine **khedhiri.me**.

### 6.1 Ajouter le domaine sur Vercel

1. Sur Vercel, dans ton projet `khedhiri`, va dans l'onglet **"Settings"**
2. Clique **"Domains"** dans le menu de gauche
3. Tape : `khedhiri.me` puis clique **"Add"**
4. Vercel va te demander de configurer les DNS chez OVH. Il affichera un truc comme :

   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

   Et aussi pour le sous-domaine www :
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

   **⚠️ Note ces valeurs exactes**, on en a besoin chez OVH.

5. Ajoute aussi `www.khedhiri.me` (clique à nouveau "Add")

### 6.2 Configurer les DNS chez OVH

1. Va sur https://www.ovh.com et connecte-toi
2. Dans **"Web Cloud"** → **"Noms de domaine"** → clique sur **khedhiri.me**
3. Onglet **"Zone DNS"**
4. Tu vas voir des enregistrements existants. ⚠️ **Ne supprime PAS les MX records** (ils servent à tes emails @khedhiri.me) !

5. **Modifier l'enregistrement A** :
   - Cherche un enregistrement de type `A` avec sous-domaine vide ou `@`
   - Modifie sa valeur pour mettre **`76.76.21.21`** (la valeur exacte donnée par Vercel)
   - Si l'enregistrement A n'existe pas, clique **"Ajouter une entrée"** → Type **A** → Sous-domaine vide → Cible `76.76.21.21`

6. **Ajouter le CNAME pour www** :
   - Clique **"Ajouter une entrée"**
   - Type : **CNAME**
   - Sous-domaine : **www**
   - Cible : **`cname.vercel-dns.com.`** (avec le point à la fin !)
   - Valide

7. **Important : conserve les MX records** pour que tes emails continuent de fonctionner.

### 6.3 Attendre la propagation

Les changements DNS mettent **5 minutes à 24h** à se propager. Souvent c'est rapide (15-30 min).

Pour vérifier en direct :
- Retourne sur Vercel → Settings → Domains
- Tu verras un statut qui passera de "Invalid Configuration" à ✅ "Valid Configuration"

### 6.4 Le moment de vérité

Une fois validé, ouvre ton navigateur et tape :

# 🌟 **https://khedhiri.me** 🌟

Tu vois ta page d'accueil ? **CHAMPION ! L'étape 1 est terminée.** 🎊

Vercel s'occupe automatiquement du certificat HTTPS — c'est sécurisé d'office.

---

## 📝 Mettre à jour CLAUDE.md

Pour que les prochaines sessions Claude Code aient tout le contexte, demande-lui :

```
Mets à jour le fichier CLAUDE.md pour ajouter ces informations dans le 
Journal des sessions :

## Statut du projet
- ✅ Étape 1 terminée le [DATE D'AUJOURD'HUI]
- ✅ Déployé sur Vercel à l'adresse https://khedhiri.me
- ✅ Code sur GitHub : github.com/[USERNAME]/Khedhiri
- ⬜ Prochaine étape : Étape 2 — Authentification avec Supabase
```

Puis pousse ce changement sur GitHub :

```
Fais un commit avec le message "Étape 1 terminée — site déployé sur khedhiri.me" 
et pousse sur GitHub.
```

À chaque push GitHub, **Vercel redéploiera automatiquement** ton site. C'est magique.

---

## 🐛 Si quelque chose ne marche pas

### "Le site n'apparaît pas sur khedhiri.me"
→ Vérifie le statut DNS sur https://dnschecker.org en tapant `khedhiri.me`. Tu dois voir partout `76.76.21.21`. Sinon attends encore.

### "J'ai un mot de passe Vercel demandé"
→ Va dans Settings → Deployment Protection et désactive (sinon le site serait protégé par mot de passe Vercel, en plus du tien).

### "Erreur de build sur Vercel"
→ Demande à Claude Code : *"Le déploiement Vercel a échoué avec cette erreur : [colle l'erreur]. Corrige le problème."*

### "Mes emails @khedhiri.me ne marchent plus"
→ Tu as supprimé les MX records par erreur. Va dans OVH → Zone DNS → restaure les enregistrements MX (ou demande à OVH de les remettre par défaut).

---

## ✅ Checklist finale

Avant de passer à l'Étape 2, vérifie :

- [ ] `node --version` répond
- [ ] `git --version` répond
- [ ] `claude --version` répond
- [ ] J'ai un compte GitHub
- [ ] J'ai un compte Vercel
- [ ] J'ai un compte Supabase (pas encore utilisé, c'est normal)
- [ ] Le projet existe dans `C:\KHEDHIRI\`
- [ ] Le dossier `docs/` et `CLAUDE.md` sont toujours présents
- [ ] Le projet est sur GitHub (privé, nommé Khedhiri)
- [ ] Le projet est déployé sur Vercel
- [ ] **https://khedhiri.me affiche bien ma page d'accueil** 🌟
- [ ] Mes emails @khedhiri.me fonctionnent toujours
- [ ] CLAUDE.md est mis à jour

---

## 🎯 Prochaine étape

**Étape 2** : Configurer Supabase et créer les 3 comptes. Sandra, Sarah et toi pourrez vous connecter.

Quand tu es prêt, reviens me voir et dis-moi *"Étape 1 terminée, on passe à la suite"* et je te prépare le guide de l'Étape 2.

---

*Bon courage Houssem ! Tu vas y arriver. Sandra et Sarah vont adorer voir ce que tu construis pour elles.* ♡
