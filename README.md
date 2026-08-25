# SAAS-Edit

Agent IA qui transforme des vidéos YouTube longues en clips courts optimisés
pour TikTok, Instagram Reels et YouTube Shorts.

Ce dépôt implémente le **MVP (mode manuel)** et le début de la **V2
(mode automatique)** :
- Mode manuel : coller un lien YouTube → transcription → détection des
  meilleurs moments → génération de clips verticaux avec sous-titres et
  hook → dashboard → téléchargement.
- Mode automatique : connecter une chaîne YouTube → surveillance
  périodique (fréquence configurable par chaîne) → détection des
  nouvelles vidéos → déclenchement automatique du même pipeline.

La publication automatique, l'analyse des tendances et les analytics
avancés arrivent dans les phases suivantes (voir [Roadmap](#roadmap)).

## Architecture

```
                         ┌──────────────────┐
                         │   apps/web        │  Next.js (App Router)
                         │   - Auth (NextAuth)│
                         │   - Dashboard      │
                         │   - Chaînes        │
                         │   - API routes     │──┐
                         └──────────────────┘   │
                                  │ Prisma       │ enqueue job
                                  ▼              ▼
                         ┌──────────────────┐  ┌──────────────┐
                         │   PostgreSQL      │  │  Redis/BullMQ │
                         │   (packages/db)   │  │  2 files       │
                         └──────────────────┘  └──────┬───────┘
                                  ▲                    │
                                  │ Prisma              ▼
                         ┌──────────────────────────────────┐
                         │   apps/worker (BullMQ worker)      │
                         │                                    │
                         │   Tick périodique (mode auto) :    │
                         │   YouTube Data API → détecte les   │
                         │   nouvelles vidéos des chaînes      │
                         │   connectées → enfile le pipeline  │
                         │                                    │
                         │   Pipeline par vidéo (manuel+auto): │
                         │   1. yt-dlp   → téléchargement     │
                         │   2. Whisper  → transcription      │
                         │   3. Claude   → moments forts,     │
                         │                 titres, hooks      │
                         │   4. ffmpeg   → crop 9:16, sous-   │
                         │                 titres, export     │
                         │   5. S3/R2    → upload des clips   │
                         └──────────────────────────────────┘
```

- **Frontend/Backend** : Next.js 14 (App Router), API routes, Tailwind CSS.
- **Base de données** : PostgreSQL + Prisma (`packages/db`, schéma partagé).
- **File d'attente** : BullMQ + Redis — le traitement vidéo est toujours
  asynchrone, jamais bloquant côté web. Deux files : `video-processing`
  (pipeline par vidéo) et `channel-monitor-tick` (sondage périodique des
  chaînes connectées, via un job scheduler BullMQ).
- **Worker vidéo** : service Node séparé (conteneurisé), avec `ffmpeg` et
  `yt-dlp` pour ne jamais faire de traitement lourd dans le serverless.
- **Stockage** : tout stockage S3-compatible (Cloudflare R2 recommandé).
- **IA** : Claude (analyse des moments forts, génération de titres/hooks/
  hashtags) + Whisper (transcription, API OpenAI ou faster-whisper local).
- **YouTube Data API v3** (`packages/youtube-api`) : résolution d'une
  chaîne (URL/@handle → channelId) et détection des nouvelles vidéos via
  la playlist "uploads" — clé API publique, pas d'OAuth requis puisqu'on
  ne lit que des métadonnées publiques.
- **Recadrage intelligent** (`apps/worker/scripts/smart_crop.py`) :
  OpenCV (détection de visage + lissage temporel) pour suivre le sujet
  principal plutôt qu'un crop centré fixe.

## Structure du dépôt

```
apps/
  web/          Next.js — dashboard, auth, API
  worker/       Worker BullMQ — pipeline vidéo + tick de surveillance
packages/
  db/           Schéma Prisma partagé + client
  youtube-api/  Client YouTube Data API v3 (résolution chaîne, uploads)
docker-compose.yml   Postgres + Redis pour le dev local
```

## Démarrer en local

Prérequis : Node ≥ 20, pnpm, Docker (pour Postgres/Redis), `ffmpeg` et
`yt-dlp` installés localement si vous lancez le worker hors Docker, ainsi
que Python 3 + `pip install -r apps/worker/scripts/requirements.txt`
pour le recadrage intelligent (sinon le pipeline retombe automatiquement
sur un crop centré, voir `SMART_CROP_ENABLED` dans `.env.example`).

```bash
# 1. Dépendances
pnpm install

# 2. Infra locale (Postgres + Redis)
pnpm infra:up

# 3. Variables d'environnement
cp .env.example .env
# renseigner ANTHROPIC_API_KEY, OPENAI_API_KEY (ou WHISPER_MODE=local),
# les identifiants de stockage S3/R2, NEXTAUTH_SECRET

# 4. Base de données
pnpm db:migrate

# 5. Lancer le web et le worker (deux terminaux)
pnpm dev:web
pnpm dev:worker
```

Le dashboard est disponible sur http://localhost:3000. Créez un compte,
collez un lien YouTube (onglet "Vidéos"), et suivez le statut du
traitement en direct (en attente → téléchargement → transcription →
analyse → montage → export → prêt). Pour le mode automatique, connectez
une chaîne depuis l'onglet "Chaînes" : le worker la surveille et
déclenche le pipeline dès qu'une nouvelle vidéo est publiée, sans action
supplémentaire.

### Clés/services externes nécessaires

| Service | Usage | Requis pour |
|---|---|---|
| `YOUTUBE_API_KEY` | Résolution de chaîne + détection des nouvelles vidéos | Onglet "Chaînes" / mode automatique |
| `ANTHROPIC_API_KEY` | Détection des moments forts, génération titres/hooks/hashtags | Étape "analyse" |
| `OPENAI_API_KEY` (ou `WHISPER_MODE=local`) | Transcription | Étape "transcription" |
| Bucket S3/R2 | Stockage des clips exportés | Étape "export" |
| `ENCRYPTION_KEY` | Chiffrement des tokens des comptes sociaux connectés | Onglet "Publication" |
| Postgres, Redis | DB et files d'attente | Tout le pipeline |

## Déployer en production

Le web et le worker se déploient séparément — le worker fait du
traitement vidéo long (téléchargement, ffmpeg, IA), il lui faut un hôte
qui supporte les processus de fond de longue durée, pas du serverless à
la Vercel.

### 1. Base de données — Supabase ou Neon (gratuit pour démarrer)

Créez un projet Postgres, récupérez l'URL de connexion pour
`DATABASE_URL`. Depuis votre machine (une seule fois, ou à chaque
migration) :

```bash
DATABASE_URL="<url-de-prod>" pnpm --filter @saas-edit/db deploy
```

### 2. Redis — Upstash (gratuit pour démarrer)

Créez une base Redis, récupérez l'URL pour `REDIS_URL`.

### 3. Stockage — Cloudflare R2 (gratuit jusqu'à 10 Go)

Créez un bucket, une clé API (accès S3), et activez l'accès public
(ou un domaine personnalisé) pour `STORAGE_PUBLIC_BASE_URL` — les URLs
de clips doivent être accessibles publiquement pour l'upload vers
TikTok/Instagram (`PULL_FROM_URL`) et l'aperçu vidéo dans le dashboard.

### 4. Worker — Railway (le plus simple) ou Fly.io

Le worker a un `Dockerfile` prêt à l'emploi (`apps/worker/Dockerfile`,
contexte de build = racine du repo, pas `apps/worker/`) qui installe
ffmpeg, yt-dlp, Python/OpenCV et compile le worker.

**Railway** détecte automatiquement le Dockerfile : créez un service à
partir de ce repo, pointez le "Root Directory" sur la racine du repo et
le "Dockerfile Path" sur `apps/worker/Dockerfile`, renseignez les
variables d'environnement (voir tableau ci-dessus + `.env.example`),
déployez. Pas de port HTTP à exposer, c'est un worker de fond.

**Fly.io** fonctionne aussi bien (`fly launch` en pointant sur le même
Dockerfile) — suivez leur documentation pour un service sans
`http_service` (processus de fond pur), leur schéma de config évoluant
régulièrement mieux vaut se fier à `fly launch` pour générer le
`fly.toml` que d'en écrire un à la main.

⚠️ Point de vigilance vérifié en construisant ce projet : pnpm bloque
par défaut les scripts `postinstall` (dont celui de `@prisma/client`).
Le `Dockerfile` lance donc explicitement `pnpm --filter @saas-edit/db
generate` avant le build — si vous adaptez le Dockerfile, gardez cette
étape, sinon le worker plante au démarrage (« did you forget to run
prisma generate? »).

### 5. Web — Vercel

Importez le repo, réglez le "Root Directory" du projet sur `apps/web`
(support monorepo natif de Vercel). `apps/web/package.json` définit un
script `vercel-build` (Vercel l'utilise automatiquement à la place de
`build` s'il existe) qui lance `prisma generate` avant `next build` —
même piège que pour le worker. Renseignez les variables d'environnement
du tableau ci-dessus dans les réglages du projet Vercel.

Un endpoint de santé est exposé sur `GET /api/health` (vérifie aussi
que la DB répond) — utile pour le monitoring externe.

### Ordre de déploiement recommandé

DB et Redis d'abord (le worker et le web en dépendent tous les deux),
puis le worker, puis le web. Testez `/api/health` une fois le web
déployé, puis collez un lien YouTube pour vérifier que le worker traite
bien la vidéo de bout en bout.

## Roadmap

### ✅ V1 — MVP (ce dépôt)
- Auth, dashboard, ajout manuel de lien YouTube.
- Pipeline : téléchargement → transcription → détection des meilleurs
  moments → génération de clips 9:16 avec sous-titres, titre, hook →
  export.
- Bibliothèque de clips : preview, édition titre/description/hashtags,
  téléchargement.
- Base d'inspiration simple (hooks, titres, formats, références, ton,
  mots à éviter) injectée dans le prompt de génération.
- Statuts de traitement visibles en temps réel.

### 🚧 V2 — Automatisation (en cours)
- ✅ Connexion de chaîne YouTube (YouTube Data API v3, lecture publique)
  et surveillance périodique (fréquence configurable par chaîne, tick
  BullMQ toutes les 5 min qui sonde les chaînes dues).
- ✅ Détection automatique des nouvelles vidéos (dédupliquées par
  `youtubeVideoId`), déclenchement auto du même pipeline que le mode
  manuel, badge "Auto" dans le dashboard pour les distinguer.
- ✅ Recadrage intelligent : détection de visage (OpenCV, `smart_crop.py`)
  + lissage temporel pour suivre le sujet principal au lieu d'un crop
  centré statique, avec repli automatique sur le crop centré si aucun
  visage n'est détecté ou si Python/OpenCV sont indisponibles
  (`SMART_CROP_ENABLED=false` pour désactiver explicitement).
- ✅ Variantes de titre/hook par clip : Claude propose 2-3 formulations
  alternatives par clip (`titleVariants`/`hookVariants`), affichées comme
  suggestions cliquables dans l'édition d'un clip.
- ☐ Variantes de rendu (styles de montage/durées différents pour un même
  moment fort).
- ☐ OAuth YouTube pour les chaînes privées/non listées (la lecture par
  clé API publique couvre déjà les chaînes publiques, cas d'usage
  principal).

### 🚧 V3 — Publication et tendances (en cours)
- ✅ Connexion des comptes TikTok/Instagram/YouTube Shorts : token API
  saisi manuellement (chiffré AES-256-GCM avant stockage, `packages/
  crypto`) — nécessite un token obtenu via l'app développeur de
  l'utilisateur/opérateur sur chaque plateforme. Une vraie connexion
  OAuth (redirection + callback) pourra remplacer cette saisie plus
  tard sans changer le reste du pipeline.
- ✅ Publication programmée ou immédiate, avec mode validation manuelle
  (brouillon → "Valider") ou automatique (réglage utilisateur), adaptée
  par plateforme (légende, hashtags). Tick worker dédié
  (`publish-scheduler-tick`) qui publie les posts dus.
- ✅ Adaptateurs de publication implémentés pour de vrai (pas des stubs)
  contre les APIs officielles : YouTube Data API v3 (upload resumable),
  TikTok Content Posting API v2 (PULL_FROM_URL), Instagram Graph API
  (conteneur média Reels + publication) — `apps/worker/src/pipeline/
  publishPost.ts`. Testés jusqu'à l'appel réseau réel (échec propre
  faute de token/domaine vérifié, comme attendu sans compte développeur
  réel).
- ☐ Analyse des tendances (formats, hooks, sons) via les APIs
  disponibles, utilisée comme inspiration — jamais de copie directe.

### V4 — Analytics et amélioration continue
- Récupération des performances post-publication (vues, likes,
  commentaires, partages, rétention) via les APIs plateformes.
- Comparaison des clips, classement, plateforme/hook les plus performants.
- Analyse des commentaires (résumé, sentiment, idées de contenu).
- Boucle d'apprentissage : les performances passées influencent le
  scoring des futurs moments forts et les réglages par défaut.

## Contraintes respectées par design

- Téléchargement vidéo via `yt-dlp` pour le compte de l'utilisateur qui
  fournit le lien — pas de scraping ni de redistribution de la source.
- Aucune publication automatique n'est prévue sans que l'utilisateur ait
  connecté ses propres comptes via les APIs officielles (V3).
- Le traitement lourd (téléchargement, transcription, montage) est
  toujours isolé dans le worker asynchrone, jamais dans le chemin de
  requête web.
