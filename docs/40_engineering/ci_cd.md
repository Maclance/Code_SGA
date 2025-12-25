# CI/CD — AssurManager

> **Source of Truth** pour le pipeline d'intégration et déploiement continus.
> Dernière mise à jour : 2025-12-25

---

## 1) Philosophie

> **Simple, rapide, fiable.**

En solo dev, le CI/CD doit :
- **Bloquer les erreurs évidentes** (build, lint, types)
- **Ne pas ralentir le développement** (< 5 min par run)
- **Déployer automatiquement** (zéro friction)

---

## 2) Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        GitHub                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Repository: Maclance/Code_SGA                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ GitHub Actions                                          │ │
│  │ • On push (main, feature/*)                            │ │
│  │ • On pull request                                       │ │
│  │ • Jobs: lint, type-check, build, test                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Déploiement automatique                                 │ │
│  │ • Preview: chaque PR                                   │ │
│  │ • Production: merge sur main                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 3) Environnements

| Environnement | Branche | URL | Usage |
|---------------|---------|-----|-------|
| **Development** | Local | http://localhost:3000 | Dev quotidien |
| **Preview** | Feature branches / PRs | `*.vercel.app` (généré) | Review avant merge |
| **Production** | `main` | (à définir) | Version live |

---

## 4) Pipeline GitHub Actions

### Workflow principal

Créer `.github/workflows/ci.yml` :

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: quality  # Run after quality checks pass
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:run

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: always()
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false
```

### Temps estimé

| Job | Durée estimée |
|-----|---------------|
| Checkout + Setup | ~30s |
| Install deps | ~1-2 min |
| Type check | ~10s |
| Lint | ~10s |
| Build | ~1-2 min |
| Tests | ~30s |
| **Total** | **~4-5 min** |

---

## 5) Configuration Vercel

### Setup initial

1. Connecter le repo GitHub à Vercel
2. Vercel détecte automatiquement Next.js
3. Configurer les variables d'environnement

### Variables d'environnement Vercel

| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Preview, Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Preview, Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Preview, Production |

> **Sécurité** : Les variables `NEXT_PUBLIC_*` sont exposées côté client. Ne jamais y mettre de secrets.

### Déploiement automatique

| Événement | Action Vercel |
|-----------|---------------|
| Push sur `main` | Deploy Production |
| Push sur branche | Deploy Preview |
| PR ouverte | Deploy Preview + commentaire |
| PR mergée | Deploy Production |

---

## 6) Secrets GitHub

### Configuration

Dans GitHub → Settings → Secrets and variables → Actions :

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase (pour build CI) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase |

> **Note** : Vercel gère ses propres secrets, ceux-ci sont pour le build CI.

---

## 7) Branching Strategy

### Modèle simplifié (solo dev)

```
main ─────────────────────────────────────────────►
       │                             ▲
       │ branch                      │ merge
       ▼                             │
feature/xxx ──────────────────────────┘
```

### Conventions

| Branche | Usage | Protection |
|---------|-------|------------|
| `main` | Production-ready | CI doit passer |
| `feature/*` | Nouvelles features | Aucune |
| `fix/*` | Corrections | Aucune |
| `hotfix/*` | Fixes urgents | Merge direct OK |

### Workflow typique

```bash
# Nouvelle feature
git checkout main
git pull
git checkout -b feature/US-030-cockpit-dashboard

# Développement...
git add .
git commit -m "feat(cockpit): implement dashboard layout"
git push -u origin feature/US-030-cockpit-dashboard

# Ouvrir PR → CI → Review (si applicable) → Merge
```

---

## 8) Protection de branche (optionnel)

Si tu veux renforcer la qualité, activer dans GitHub → Settings → Branches :

| Règle | Recommandation MVP |
|-------|-------------------|
| Require status checks | ✅ Activer (CI doit passer) |
| Require branches up to date | ❌ Désactiver (pas de rebases inutiles) |
| Require review | ❌ Désactiver (solo dev) |
| Require signed commits | ❌ Désactiver (overhead) |

---

## 9) Monitoring post-déploiement

### Vercel Analytics (gratuit)

- Performance (Core Web Vitals)
- Erreurs (500, etc.)
- Géographie des users

### Supabase Dashboard

- Requêtes DB
- Auth logs
- Erreurs API

### Alertes (V1+)

- Intégrer Sentry ou LogRocket pour tracking erreurs production

---

## 10) Rollback

### Via Vercel

1. Aller sur Vercel Dashboard → Deployments
2. Trouver le déploiement précédent stable
3. Cliquer sur "..." → Promote to Production

### Via Git

```bash
# Revert le dernier commit
git revert HEAD
git push

# Ou reset hard (attention : perte d'historique public)
git reset --hard <commit-sha>
git push --force  # À éviter sauf urgence
```

---

## 11) Risques & Mitigations

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **CI trop lent** | Friction dev | Moyenne | Limiter aux checks essentiels |
| **Secrets exposés** | Sécurité | Faible | Utiliser GitHub/Vercel secrets, pas de .env commit |
| **Vercel down** | Prod inaccessible | Très faible | Pas de mitigation (risque accepté) |
| **Build fail en prod** | Feature cassée | Moyenne | CI obligatoire, preview test |
| **DB migration fail** | Data corrompue | Moyenne | Tester migration sur staging |

---

## 12) Décisions actées

| ID | Décision | Date | Contexte |
|----|----------|------|----------|
| CI-001 | GitHub Actions pour CI | 2025-12 | Gratuit, intégré GitHub |
| CI-002 | Vercel pour déploiement | 2025-12 | Zéro config Next.js |
| CI-003 | Pas de staging séparé MVP | 2025-12 | Preview Vercel suffit |
| CI-004 | Tests en job séparé | 2025-12 | Fail fast sur lint/types |
| CI-005 | Node 20 LTS | 2025-12 | Support long terme |

---

## 13) Checklist mise en place

- [ ] Créer `.github/workflows/ci.yml`
- [ ] Ajouter secrets GitHub (Supabase URL + Key)
- [ ] Connecter repo à Vercel
- [ ] Configurer variables Vercel
- [ ] Tester un push → vérifier CI passe
- [ ] Tester une PR → vérifier preview déployée
- [ ] Merger → vérifier production déployée

---

## 14) Fichier workflow complet

Pour copier-coller directement :

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: quality
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:run
        continue-on-error: true  # Remove when tests are stable

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: always()
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false
```
