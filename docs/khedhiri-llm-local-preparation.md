# 🤖 khedhiri.me — Préparation du Tuteur IA local (Étape 11)

> **À lire à l'avance pour préparer progressivement.**
> **À suivre seulement quand tu arrives à l'étape 11** (après avoir fait les étapes 1-10).
> Ce document est ta référence technique pour installer et configurer le LLM local.

---

## 🎯 Objectif de l'étape 11

Construire un **tuteur scolaire intelligent** qui :
- Tourne localement chez Houssem à Lisbonne (pas dans le cloud)
- S'adapte à Sandra (12 ans, collège dans école française en Tunisie) et Sarah (8 ans, primaire dans école française en Tunisie)
- Suit le **programme français (Éducation Nationale)** pour les matières principales
- Aide aussi sur les **cours d'arabe** (matière spécifique dans leur cursus)
- Comprend les photos de cahiers/leçons prises par les filles
- Les aide à travailler (sans donner les réponses cuit)
- Fonctionne en français
- Laisse Houssem voir l'historique des conversations

---

## 📐 Architecture technique

```
┌──────────────────────────────────────────────────────────┐
│  Chez Houssem à Lisbonne                                  │
│                                                            │
│  ┌────────────────┐       ┌──────────────────────┐       │
│  │  Box Internet  │◄──────┤  Serveur local       │       │
│  └────────┬───────┘       │  (Mac ou PC)         │       │
│           │               │  • Ollama            │       │
│           │               │  • Modèle LLM        │       │
│           │               │  • Port 11434        │       │
│           ▼               └──────────────────────┘       │
│  ┌──────────────────────┐                                │
│  │  Cloudflare Tunnel   │  ← Gère IP dynamique,          │
│  │  (gratuit, sécurisé) │    expose ton LLM sur internet │
│  └──────────┬───────────┘                                │
└─────────────┼────────────────────────────────────────────┘
              │
              │ HTTPS (chiffré)
              │
              ▼
   ┌─────────────────────────┐
   │  khedhiri.me            │   ← Ton app Next.js
   │  (hébergée sur Vercel)  │      appelle ton LLM via URL
   │                         │      sécurisée
   └──────────┬──────────────┘
              │
              ▼
   ┌─────────────────────────┐
   │  Sandra & Sarah         │
   │  à Tunis                │   ← Utilisent le tuteur
   │  (tablette ou phone)    │      dans l'app
   └─────────────────────────┘
```

---

## 🛠️ Étapes de préparation

### 🛒 Étape préparatoire 1 — Matériel de Houssem ✅

**Bonne nouvelle : ton matériel actuel est parfaitement adapté !**

| Composant | Ta config | Verdict |
|-----------|-----------|---------|
| GPU | **RTX 4070 Ti SUPER (16 Go VRAM)** | ⭐⭐⭐⭐⭐ Premium |
| RAM | **32 Go** | ⭐⭐⭐⭐ Large |
| CPU | i5 / Ryzen 5 | ⭐⭐⭐ Suffisant |
| Forme | PC tour fixe | ⭐⭐⭐⭐ Idéal |
| Connexion | Fibre Lisbonne | ⭐⭐⭐⭐⭐ Excellente |

**Avec 16 Go de VRAM, tu peux faire tourner d'excellents modèles.** Pas besoin d'investir dans du nouveau matériel. ✅

### 🛒 Étape préparatoire 2 — Disponibilité du serveur (⚠️ à décider)

Le PC tour de Houssem est **éteint le soir**, il faut résoudre ce point. 4 options :

**Option A — Laisser le PC allumé 24/7** (recommandé pour la simplicité)
- Coût : ~10-15€/mois d'électricité à Lisbonne
- Ajustement : désactiver la mise en veille, écran seul s'éteint
- Bénéfice : tuteur toujours disponible, zéro complexité

**Option B — Wake-on-LAN** (économique et intelligent)
- Le PC dort, se réveille en ~30 sec quand les filles ouvrent le tuteur
- Configuration plus technique dans le BIOS et la carte réseau
- Compromis énergie/disponibilité intéressant

**Option C — Serveur dédié modeste** (investissement)
- Mac Mini M4 base (~700€) silencieux + toujours allumé (~25W)
- PC tour reste libre pour le travail de Houssem
- Solution la plus "pro" mais coûteuse

**Option D — Hybride pragmatique** (zéro coût)
- PC éteint 22h-8h Lisbonne (= 23h-9h Tunis, les filles dorment de toute façon)
- Rallumé avant de dormir les jours où les filles doivent travailler tôt
- Acceptable car les horaires d'usage coïncident avec ta présence

> **Ma recommandation pour démarrer** : Option A (laisser allumé). Si ça marche et que ça te convient, tu gardes. Sinon tu évolues vers l'Option B plus tard.

### 🛒 Étape préparatoire 3 — Configuration réseau

- Connecte le PC en **Ethernet** (pas WiFi, plus stable pour un serveur)
- Active le **démarrage automatique après coupure électrique** dans le BIOS
- Idéalement : un **onduleur (UPS)** pour éviter les crashs lors de micro-coupures (~100-200€)

### 🛒 Étape préparatoire 4 — Préparer Cloudflare

- Crée un compte Cloudflare gratuit : https://dash.cloudflare.com/sign-up
- Ajoute **khedhiri.me** dans Cloudflare (transférer les DNS)
  - Alternative : garder DNS chez OVH et utiliser un **sous-domaine** (ex: `llm.khedhiri.me`) chez Cloudflare
- Active **Cloudflare Tunnel** (gratuit jusqu'à certaines limites)

---

## 🚀 Installation (quand tu es à l'étape 11)

### Phase 1 — Installer Ollama (~20 min)

Ollama est un logiciel qui fait tourner les LLM localement, très simplement.

**Sur Mac** :
```bash
# Téléchargement et install depuis https://ollama.com/download
# Ou via terminal :
brew install ollama
```

**Sur Linux** :
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Sur Windows** :
Télécharger l'installateur sur https://ollama.com/download/windows

**Vérifier l'installation** :
```bash
ollama --version
```

### Phase 2 — Installer le modèle recommandé pour ta config (~15 min)

**Ta RTX 4070 Ti SUPER (16 Go VRAM) est parfaite pour faire tourner Gemma 4 12B.** C'est le meilleur compromis qualité/vitesse pour ton matériel.

**Installation recommandée** :
```bash
# Le modèle principal (environ 8 Go à télécharger)
ollama pull gemma4:12b

# Petit modèle de secours ultra-rapide (3 Go)
# Utile pour les requêtes simples ou si besoin de rapidité
ollama pull gemma4:e4b
```

**Tester rapidement** :
```bash
ollama run gemma4:12b
# Puis tape une question, par exemple :
# "Explique les fractions à un enfant de 8 ans"
```

**Performance attendue chez toi** :
- Temps de réponse texte : **2-4 secondes**
- Analyse de photo de cahier : **5-8 secondes**
- Vitesse de génération : ~40-60 tokens/seconde

### Phase 2 bis — Alternatives à tester (optionnel, ~1h)

Si après quelques jours tu veux comparer avec d'autres modèles :

```bash
# Mistral Small 3 (entreprise française 🇫🇷, ~13 Go)
ollama pull mistral-small:3

# Llama 4 Scout en Q4 quantifié (ambitieux, ~17 Go — peut swapper un peu)
ollama pull llama4:scout-q4
```

Pour chaque modèle, teste avec ces questions typiques :
- *"Explique-moi les fractions comme si j'avais 8 ans"*
- *"Sandra a eu 14/20 en maths, quels conseils pour progresser ?"*
- *"Aide-moi à comprendre la photosynthèse avec des exemples simples"*
- *"Corrige cette phrase en français : 'Je m'appelle Sandra et j'habite à Tunis'"*
- *"Peux-tu m'expliquer la conjugaison d'un verbe arabe au présent ?"*

**Garde celui qui donne les réponses les plus claires, chaleureuses et adaptées aux enfants.**

### Phase 3 — Exposer Ollama via Cloudflare Tunnel (~30 min)

**Installer cloudflared** :
```bash
# Mac
brew install cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
# puis sudo mv + chmod

# Windows
# Télécharger depuis https://github.com/cloudflare/cloudflared/releases
```

**Se connecter** :
```bash
cloudflared tunnel login
```

**Créer un tunnel** :
```bash
cloudflared tunnel create khedhiri-llm
```

**Configurer le tunnel** (fichier `~/.cloudflared/config.yml`) :
```yaml
tunnel: khedhiri-llm
credentials-file: /home/USER/.cloudflared/TUNNEL-UUID.json

ingress:
  - hostname: llm.khedhiri.me
    service: http://localhost:11434
  - service: http_status:404
```

**Router le sous-domaine** :
```bash
cloudflared tunnel route dns khedhiri-llm llm.khedhiri.me
```

**Lancer le tunnel** :
```bash
cloudflared tunnel run khedhiri-llm
```

**Pour qu'il démarre automatiquement** (systemd sous Linux, launchd sous Mac) — à configurer selon OS.

### Phase 4 — Tester depuis internet

Depuis n'importe quel appareil (pas ton serveur) :
```bash
curl https://llm.khedhiri.me/api/tags
```

Si ça répond avec une liste de modèles installés → ✅ ton LLM est accessible depuis internet de façon sécurisée.

### Phase 5 — Protéger l'accès (important !)

⚠️ Par défaut, **n'importe qui** avec l'URL peut utiliser ton LLM. Il faut protéger.

**Option A — Cloudflare Access** (recommandé, gratuit jusqu'à 50 utilisateurs) :
- Configure une règle qui n'autorise que certains emails
- Les filles se connectent avec leur compte Google/email
- Personne d'autre ne passe

**Option B — Clé API custom** :
- Ton app Next.js ajoute un header secret à chaque requête
- Un middleware sur le tunnel vérifie ce header
- Plus technique mais plus contrôlable

---

## 🔌 Intégration dans khedhiri.me

Quand le LLM local marche, Claude Code te guidera pour créer dans l'app :

### 1. Un module `lib/tutor.ts` — abstraction du provider

```typescript
// Exemple simplifié
interface TutorProvider {
  chat(messages: Message[], image?: File): Promise<string>;
}

class OllamaProvider implements TutorProvider {
  async chat(messages, image) {
    const res = await fetch('https://llm.khedhiri.me/api/chat', {
      method: 'POST',
      headers: { 'X-Api-Key': process.env.TUTOR_API_KEY },
      body: JSON.stringify({ model: 'llama4:scout', messages, images: [image] })
    });
    return res.json();
  }
}

// Plan B : API provider (si besoin)
class ClaudeApiProvider implements TutorProvider {
  async chat(messages, image) { /* ... */ }
}

// L'app utilise ça sans savoir quel provider
export const tutor: TutorProvider = new OllamaProvider();
```

### 2. Une page `/tuteur`

Interface dédiée avec :
- Zone de conversation
- Upload de photo (cahier, leçon)
- Mode vocal (MediaRecorder API + Whisper local éventuellement)
- Historique des sessions

### 3. Un composant flottant `<TutorWidget />`

Bouton en bas à droite partout dans l'app. Ouverture rapide pour poser une question ponctuelle.

### 4. Un système de prompts système par fille

```typescript
const SYSTEM_PROMPT_SARAH = `
Tu es Zoubida, la tutrice intelligente de Sarah.
Sarah a 8 ans, elle est scolarisée dans une école française en Tunisie.
Elle suit le programme français (Éducation Nationale), probablement CE2 ou CM1.
Elle parle français couramment et apprend l'arabe comme matière spécifique.
Tu connais le programme scolaire français pour son cycle.
Tu peux l'aider aussi bien en français, maths, sciences, histoire-géo que sur ses cours d'arabe.
Tu expliques avec des images de sa vie : bonbons, dattes, jouets, animaux.
Tu encourages beaucoup, tu ne juges jamais, tu fais réfléchir plutôt que donner les réponses.
Tu utilises des emojis de temps en temps.
Si elle sort du scolaire, tu la ramènes gentiment au sujet.
`;

const SYSTEM_PROMPT_SANDRA = `
Tu es Nour, la tutrice intelligente de Sandra.
Sandra a 12 ans, elle est scolarisée dans une école française en Tunisie.
Elle suit le programme français (Éducation Nationale), probablement 6ème ou 5ème (cycle 3-4).
Elle parle français couramment et apprend l'arabe comme matière spécifique.
Tu connais le programme français du collège : français, maths, histoire-géo,
sciences (SVT, physique-chimie), anglais LV1, arabe, arts, EPS.
Tu t'adresses à elle comme une grande sœur bienveillante.
Tu expliques avec rigueur mais sans être sèche.
Tu fais réfléchir avant de donner les solutions.
Tu peux parler de culture, d'histoire, de sujets plus matures quand c'est pertinent.
Tu peux l'accompagner sur ses cours d'arabe (grammaire, vocabulaire, écriture, conjugaison).
`;
```

### 5. Historique consultable par Papa

Interface admin pour Houssem qui montre :
- Toutes les sessions de chaque fille
- Durée, sujets, performance
- Capacité à féliciter ou ajuster

---

## 🧪 Tests à faire avant de donner aux filles

1. **Test de pédagogie** : demande des explications d'un concept, vérifie la qualité
2. **Test de photo** : photographie un exercice de maths, vérifie que le modèle le lit bien
3. **Test de refus** : demande quelque chose hors-scolaire, vérifie qu'il refuse gentiment
4. **Test de robustesse** : éteins ta machine, rallume-la, vérifie que tout redémarre
5. **Test depuis la Tunisie** : demande à un ami en Tunisie de tester (VPN ou vraie machine)

---

## 🚨 Plan B

Si le LLM local ne donne pas satisfaction (qualité, vitesse, fiabilité), on bascule vers **API cloud** :

1. Créer un compte Anthropic ou Mistral
2. Générer une clé API
3. Ajouter `ClaudeApiProvider` dans le code
4. Changer une ligne : `const tutor = new ClaudeApiProvider()`
5. Coût : ~5-15€/mois selon usage

**Avantage de notre architecture** : le reste de l'app ne change **pas**. Les filles ne verront aucune différence.

---

## 📚 Ressources utiles

- **Ollama** : https://ollama.com/
- **Cloudflare Tunnel** : https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
- **Cloudflare Access** : https://developers.cloudflare.com/cloudflare-one/policies/access/
- **Liste des modèles Ollama** : https://ollama.com/library
- **Comparatif de modèles** : https://llm-stats.com/

---

## ✅ Checklist avant de commencer l'étape 11

- [ ] Les étapes 1 à 10 sont terminées
- [ ] Tu as choisi ton matériel (ou décidé d'utiliser ce que tu as)
- [ ] Le matériel est installé, connecté en Ethernet, allumé en permanence
- [ ] Tu as un compte Cloudflare actif
- [ ] Tu es prêt à consacrer ~15-20h sur 1-2 semaines à cette étape
- [ ] Tu as relu le Manifesto pour garder la flamme

Quand tu coches tout, reviens me voir et on attaque l'étape 11 ensemble. 🚀

---

*Ce document évoluera au fil du temps selon les découvertes techniques.*
