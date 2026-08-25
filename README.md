# SAAS-Edit

Agent IA qui transforme des vidéos YouTube longues en clips courts optimisés
pour TikTok, Instagram Reels et YouTube Shorts.

Ce dépôt implémente le **MVP en mode manuel** : coller un lien YouTube →
transcription → détection des meilleurs moments → génération de clips
verticaux avec sous-titres et hook → dashboard → téléchargement. La
surveillance automatique de chaînes, la publication automatique, l'analyse
des tendances et les analytics avancés arrivent dans les phases suivantes
(voir [Roadmap](#roadmap)).

## Architecture

```
                         ┌──────────────────┐
                         │   apps/web        │  Next.js (App Router)
                         │   - Auth (NextAuth)│
                         │   - Dashboard      │
                         │   - API routes     │──┐
                         └──────────────────┘   │
                                  │ Prisma       │ enqueue job
                                  ▼              ▼
                         ┌──────────────────┐  ┌──────────────┐
                         │   PostgreSQL      │  │  Redis/BullMQ │
                         │   (packages/db)   │  │  file d'attente│
                         └──────────────────┘  └──────┬───────┘
                                  ▲                    │
                                  │ Prisma              ▼
                         ┌──────────────────────────────────┐
                         │   apps/worker (BullMQ worker)      │
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
  asynchrone, jamais bloquant côté web.
- **Worker vidéo** : service Node séparé (conteneurisé), avec `ffmpeg` et
  `yt-dlp` pour ne jamais faire de traitement lourd dans le serverless.
- **Stockage** : tout stockage S3-compatible (Cloudflare R2 recommandé).
- **IA** : Claude (analyse des moments forts, génération de titres/hooks/
  hashtags) + Whisper (transcription, API OpenAI ou faster-whisper local).

## Structure du dépôt

```
apps/
  web/       Next.js — dashboard, auth, API
  worker/    Worker BullMQ — pipeline de traitement vidéo
packages/
  db/        Schéma Prisma partagé + client
docker-compose.yml   Postgres + Redis pour le dev local
```

## Démarrer en local

Prérequis : Node ≥ 20, pnpm, Docker (pour Postgres/Redis), `ffmpeg` et
`yt-dlp` installés localement si vous lancez le worker hors Docker.

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
collez un lien YouTube, et suivez le statut du traitement en direct
(en attente → téléchargement → transcription → analyse → montage → export
→ prêt).

### Clés/services externes nécessaires

| Service | Usage | Requis pour |
|---|---|---|
| `ANTHROPIC_API_KEY` | Détection des moments forts, génération titres/hooks/hashtags | Étape "analyse" |
| `OPENAI_API_KEY` (ou `WHISPER_MODE=local`) | Transcription | Étape "transcription" |
| Bucket S3/R2 | Stockage des clips exportés | Étape "export" |
| Postgres, Redis | DB et file d'attente | Tout le pipeline |

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

### V2 — Automatisation
- Connexion de chaîne YouTube (OAuth + YouTube Data API v3) et
  surveillance périodique (fréquence configurable).
- Détection automatique des nouvelles vidéos, déclenchement auto du
  pipeline.
- Recadrage intelligent (tracking de sujet/visage) au lieu du crop centré
  statique.
- Plusieurs variantes de clip par moment fort (styles/durées différents).

### V3 — Publication et tendances
- Connexion des comptes TikTok/Instagram/YouTube Shorts (APIs officielles).
- Publication automatique ou programmée, avec mode validation manuelle.
- Adaptation du format/description/hashtags par plateforme.
- Analyse des tendances (formats, hooks, sons) via les APIs disponibles,
  utilisée comme inspiration — jamais de copie directe.

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
