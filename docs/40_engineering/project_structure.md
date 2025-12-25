# Structure Projet — AssurManager

> **Source of Truth** pour l'organisation des fichiers et conventions de nommage.
> Dernière mise à jour : 2025-12-25

---

## 1) Arborescence cible

```
Code_SGA/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       └── ci.yml
│
├── docs/                       # Documentation (hors code)
│   ├── 00_product/             # PRD, backlog, scope, glossaire
│   ├── 10_game_design/         # Gameplay, modes, scoring
│   ├── 20_simulation/          # Moteur, indices, événements
│   ├── 30_ux_ui/               # Flows, écrans, design system
│   ├── 40_engineering/         # Stack, env, CI/CD, tests (CE DOSSIER)
│   ├── 50_security_compliance/ # Auth, RBAC, RGPD
│   ├── 60_github/              # Branching, templates
│   ├── 70_ai/                  # Prompts Antigravity
│   ├── 80_api_data/            # Data model, API spec
│   └── README.md               # Index documentation
│
├── scripts/                    # Scripts utilitaires (non déployés)
│   └── *.ps1                   # Scripts PowerShell (GitHub, migrations, etc.)
│
├── src/                        # Code source
│   ├── app/                    # Next.js App Router (pages + API)
│   │   ├── (auth)/             # Routes authentification (groupées)
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (game)/             # Routes jeu (groupées)
│   │   │   ├── session/
│   │   │   ├── cockpit/
│   │   │   └── decisions/
│   │   ├── (admin)/            # Routes admin (groupées)
│   │   │   └── dashboard/
│   │   ├── api/                # Route Handlers (API interne)
│   │   │   ├── session/
│   │   │   └── engine/
│   │   ├── globals.css         # Styles globaux
│   │   ├── layout.tsx          # Layout racine
│   │   └── page.tsx            # Page d'accueil
│   │
│   ├── components/             # Composants React réutilisables
│   │   ├── ui/                 # Composants UI génériques (Button, Card, etc.)
│   │   ├── cockpit/            # Composants spécifiques cockpit
│   │   ├── decisions/          # Composants écran décisions
│   │   └── shared/             # Composants partagés (Header, Footer, etc.)
│   │
│   ├── lib/                    # Utilitaires et clients
│   │   ├── supabase/           # Clients Supabase (client.ts, server.ts)
│   │   ├── engine/             # Moteur de simulation (cœur métier)
│   │   │   ├── indices/        # Calcul des 7 indices
│   │   │   ├── events/         # Gestion événements
│   │   │   ├── levers/         # Logique leviers
│   │   │   └── engine.ts       # Point d'entrée moteur
│   │   └── utils/              # Fonctions utilitaires génériques
│   │
│   ├── hooks/                  # Custom React hooks
│   │   └── useSession.ts
│   │
│   ├── types/                  # Types TypeScript globaux
│   │   ├── game.ts             # Types partie/session
│   │   ├── engine.ts           # Types moteur
│   │   └── database.ts         # Types Supabase (générés)
│   │
│   └── constants/              # Constantes métier
│       ├── companies.ts        # 18 compagnies
│       └── events.ts           # Catalogue événements
│
├── supabase/                   # Configuration Supabase (migrations)
│   ├── migrations/             # Fichiers SQL versionnés
│   │   └── 001_initial.sql
│   └── seed.sql                # Données initiales (dev)
│
├── tests/                      # Tests (miroir de src/)
│   ├── lib/
│   │   └── engine/
│   │       └── engine.test.ts
│   └── setup.ts                # Configuration Vitest
│
├── .env.local.example          # Template variables d'environnement
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md                   # README projet (quickstart)
```

---

## 2) Conventions de nommage

### Fichiers et dossiers

| Type | Convention | Exemple |
|------|------------|---------|
| **Dossiers** | `kebab-case` | `game-session/` |
| **Composants React** | `PascalCase.tsx` | `CockpitDashboard.tsx` |
| **Pages App Router** | `page.tsx` (obligatoire) | `app/cockpit/page.tsx` |
| **Layouts** | `layout.tsx` | `app/(game)/layout.tsx` |
| **Route Handlers** | `route.ts` | `app/api/session/route.ts` |
| **Utilitaires/libs** | `camelCase.ts` | `calculateIndices.ts` |
| **Types** | `camelCase.ts` | `game.ts` |
| **Tests** | `*.test.ts` | `engine.test.ts` |
| **CSS Modules** | `ComponentName.module.css` | `CockpitDashboard.module.css` |

### Variables et fonctions

| Type | Convention | Exemple |
|------|------------|---------|
| **Variables** | `camelCase` | `sessionId` |
| **Constantes** | `UPPER_SNAKE_CASE` | `MAX_TURNS` |
| **Fonctions** | `camelCase` | `calculateIPP()` |
| **Composants** | `PascalCase` | `function CockpitDashboard()` |
| **Types/Interfaces** | `PascalCase` | `interface GameSession` |
| **Enums** | `PascalCase` + membres `PascalCase` | `enum Difficulty { Novice, Intermediate }` |

### Imports

```typescript
// 1. Dépendances externes
import { createClient } from '@supabase/supabase-js';

// 2. Alias internes (@/*)
import { calculateIndices } from '@/lib/engine/indices';
import type { GameSession } from '@/types/game';

// 3. Imports relatifs (même feature)
import { LocalComponent } from './LocalComponent';
```

---

## 3) Règles d'organisation

### Approche : Feature-based + Layer-based hybride

```
src/
├── app/          # Routes (Next.js impose cette structure)
├── components/   # UI réutilisable (layer)
├── lib/          # Logique métier (layer)
│   └── engine/   # Feature-based à l'intérieur
├── hooks/        # Hooks React (layer)
├── types/        # Types (layer)
└── constants/    # Données statiques (layer)
```

**Règle** : Si un élément n'est utilisé que dans UNE feature, il peut rester co-localisé. Dès qu'il est partagé, il remonte dans le dossier approprié.

### Où placer quoi ?

| Élément | Emplacement | Critère |
|---------|-------------|---------|
| Page | `app/***/page.tsx` | SI c'est une route |
| Composant partagé | `components/` | SI utilisé par 2+ pages |
| Composant local | Co-localisé avec la page | SI utilisé par 1 page |
| Logique métier pure | `lib/` | SI indépendant de React |
| Hook React | `hooks/` | SI utilise useState/useEffect |
| Type global | `types/` | SI utilisé par 2+ fichiers |
| Constante métier | `constants/` | SI donnée statique partagée |

---

## 4) Route Groups (App Router)

Next.js 15 permet de grouper les routes sans affecter l'URL via `(nom)`.

```
app/
├── (auth)/           # Groupe auth (URL: /login, /signup)
│   ├── login/
│   └── signup/
├── (game)/           # Groupe jeu (URL: /session, /cockpit)
│   ├── layout.tsx    # Layout spécifique jeu (sidebar, header)
│   ├── session/
│   └── cockpit/
└── (admin)/          # Groupe admin (URL: /dashboard)
    └── dashboard/
```

**Avantage** : Layouts partagés par groupe sans polluer l'URL.

---

## 5) Moteur de simulation (lib/engine/)

Le moteur est le **cœur métier**. Il doit être :
- **Pur** : pas de dépendances React, pas d'appels API
- **Testable** : fonctions entrée → sortie
- **Isolé** : pas d'effets de bord

```
lib/engine/
├── engine.ts           # Point d'entrée : resolveTurn()
├── indices/
│   ├── iac.ts          # Calcul IAC
│   ├── ipqo.ts         # Calcul IPQO
│   └── index.ts        # Export unifié
├── events/
│   ├── market.ts       # Événements marché
│   ├── company.ts      # Événements compagnie
│   └── index.ts
├── levers/
│   ├── pricing.ts      # Logique tarification
│   ├── hr.ts           # Logique RH
│   └── index.ts
└── types.ts            # Types spécifiques moteur
```

---

## 6) Risques & Mitigations

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Structure s'éparpille** | Difficulté à retrouver du code | Haute | Appliquer ce document, revue régulière |
| **Composants dupliqués** | Incohérence UI | Moyenne | Créer `components/ui/` dès qu'un pattern se répète |
| **Moteur pollué par React** | Tests impossibles | Moyenne | Règle stricte : `lib/engine/` = pas d'imports React |
| **Nommage incohérent** | Confusion | Moyenne | Linter + ce document |
| **Dossiers trop profonds** | Navigation pénible | Faible | Max 4 niveaux de profondeur |

---

## 7) Décisions actées

| ID | Décision | Date | Contexte |
|----|----------|------|----------|
| STRUCT-001 | App Router exclusivement | 2025-12 | Pas de `/pages`, tout en `/app` |
| STRUCT-002 | Moteur isolé dans `lib/engine/` | 2025-12 | Testabilité, portabilité |
| STRUCT-003 | CSS Modules pour styling | 2025-12 | Co-location, scope automatique |
| STRUCT-004 | Alias `@/*` pour imports | 2025-12 | Évite imports relatifs profonds |
| STRUCT-005 | Tests en miroir dans `/tests` | 2025-12 | Séparation claire code/tests |

---

## 8) Checklist nouvelle feature

- [ ] Identifier le(s) dossier(s) concerné(s)
- [ ] Respecter les conventions de nommage
- [ ] Si logique pure → `lib/`
- [ ] Si composant partagé → `components/`
- [ ] Si nouveau type → `types/`
- [ ] Ajouter les tests correspondants dans `tests/`
